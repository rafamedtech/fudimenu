'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Layers3, Plus, Settings2, Utensils } from 'lucide-react';
import { useMemo, useReducer, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { resolveBrandSurfaceColor } from '@/lib/brand-theme';
import { reorderSectionsAction } from '@/server/actions/sections.actions';
import type { MenuSection } from '@/types/domain';

interface SectionGridProps {
  sections: MenuSection[];
  canCreateSection: boolean;
  itemCountBySectionId?: Record<string, number>;
}

export function SectionGrid({ sections, canCreateSection, itemCountBySectionId }: SectionGridProps) {
  const [items, setItems] = useReducer((_: MenuSection[], next: MenuSection[]) => next, sections);
  const [reorderMode, setReorderMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );
  const ids = useMemo(() => items.map((section) => section.id), [items]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((section) => section.id === active.id);
    const newIndex = items.findIndex((section) => section.id === over.id);
    const nextItems = arrayMove(items, oldIndex, newIndex);
    const previous = items;
    setItems(nextItems);

    startTransition(async () => {
      const result = await reorderSectionsAction({ sectionIds: nextItems.map((item) => item.id) });
      if (!result.ok) {
        setItems(previous);
        toast.error('No se pudo reordenar');
        return;
      }
      toast.success('Orden guardado');
    });
  }

  return (
    <section className="space-y-3 ipad:space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">
            Arquitectura del menú
          </p>
          <h2 className="mt-1 text-xl font-black text-ink-900 ipad:text-2xl">Secciones</h2>
          <p className="mt-1 hidden max-w-xl text-sm font-medium leading-6 text-ink-500 ipad:block">
            Ordena la carta como la ve el cliente: primero secciones, después categorías y platillos.
          </p>
        </div>
        {items.length > 1 && (
          <Button
            type="button"
            size="sm"
            variant={reorderMode ? 'secondary' : 'outline'}
            onClick={() => setReorderMode((value) => !value)}
            disabled={isPending}
          >
            <GripVertical className="size-4" aria-hidden />
            Reordenar
          </Button>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 ipad:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] ipad:gap-4 desktop:gap-5">
            {items.map((section) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                reorderMode={reorderMode}
                itemCount={itemCountBySectionId?.[section.id] ?? 0}
              />
            ))}
            {canCreateSection && (
              <li>
                <Link
                  href="/menu/sections/new"
                  className="group flex aspect-[6/5] min-h-40 flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed border-ink-300 bg-[rgb(var(--brand-card-rgb)/0.72)] px-5 text-center text-ink-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] hover:shadow-md focus-visible:outline-none focus-visible:shadow-glow-mostaza ipad:aspect-[5/4] ipad:min-h-44 ipad:gap-4"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-[var(--brand-coral-soft)] text-ink-900 transition-transform duration-200 group-hover:scale-105">
                    <Plus className="size-6" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-base font-extrabold text-ink-900">Nueva sección</span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-ink-500">
                      Desayunos, bebidas, postres
                    </span>
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableSectionCard({
  section,
  reorderMode,
  itemCount,
}: {
  section: MenuSection;
  reorderMode: boolean;
  itemCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: !reorderMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? 'z-10 opacity-80' : undefined}>
      <Card
        className="group relative aspect-[6/5] min-h-40 overflow-hidden p-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ipad:aspect-[5/4] ipad:min-h-44"
        style={{ backgroundColor: resolveBrandSurfaceColor(section.accentColor) }}
      >
        {section.coverImageUrl ? (
          <Image
            src={section.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 220px, (min-width: 1024px) 230px, (min-width: 768px) 230px, 50vw"
            className="object-cover opacity-85 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="absolute inset-4 rounded-xl border border-[rgb(var(--brand-card-rgb)/0.6)] bg-[rgb(var(--brand-card-rgb)/0.3)]" />
            <span className="relative flex size-16 items-center justify-center rounded-full bg-[rgb(var(--brand-card-rgb)/0.7)] text-ink-700 shadow-sm">
              <Utensils className="size-8" strokeWidth={1.8} />
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/85 via-ink-900/55 to-transparent p-3 pt-14 ipad:p-4 ipad:pt-16">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="line-clamp-2 text-base font-extrabold leading-tight text-white ipad:text-lg">
                {section.name}
              </h2>
              <p className="mt-1 text-xs font-semibold text-white/90">
                {itemCount === 0
                  ? 'Sin platillos'
                  : itemCount === 1
                    ? '1 platillo'
                    : `${itemCount} platillos`}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[rgb(var(--brand-card-rgb)/0.15)] px-2 py-1 text-[11px] font-bold text-white backdrop-blur ipad:inline-flex">
              <Layers3 className="size-3" aria-hidden />
              Sección
            </span>
          </div>
        </div>
        {reorderMode ? (
          <button
            type="button"
            className="absolute inset-0 flex items-start justify-end p-2 text-white"
            aria-label={`Mover ${section.name}`}
            {...attributes}
            {...listeners}
          >
            <span className="rounded-md bg-ink-900/70 p-2">
              <GripVertical className="size-5" aria-hidden />
            </span>
          </button>
        ) : (
          <>
            <Link href={`/menu/s/${section.id}`} className="absolute inset-0" aria-label={section.name} />
            <Link
              href={`/menu/sections/${section.id}/edit`}
              className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-md bg-[var(--brand-card)] text-ink-900 shadow-sm"
              aria-label={`Editar ${section.name}`}
            >
              <Settings2 className="size-4" aria-hidden />
            </Link>
          </>
        )}
      </Card>
    </li>
  );
}
