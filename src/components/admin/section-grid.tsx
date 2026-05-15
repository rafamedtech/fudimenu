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
import { GripVertical, Plus, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { reorderSectionsAction } from '@/server/actions/sections.actions';
import type { MenuSection } from '@/types/domain';

interface SectionGridProps {
  sections: MenuSection[];
  canCreateSection: boolean;
  itemCountBySectionId?: Record<string, number>;
}

export function SectionGrid({ sections, canCreateSection, itemCountBySectionId }: SectionGridProps) {
  const [items, setItems] = useState(sections);
  const [reorderMode, setReorderMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );
  const ids = useMemo(() => items.map((section) => section.id), [items]);

  useEffect(() => {
    setItems(sections);
  }, [sections]);

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
    <section className="space-y-3">
      {items.length > 1 && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant={reorderMode ? 'secondary' : 'outline'}
            onClick={() => setReorderMode((value) => !value)}
            disabled={isPending}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
            Reordenar
          </Button>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3">
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
                  className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-lg border-[1.5px] border-dashed border-ink-300 bg-white text-center text-ink-700 shadow-sm transition-colors hover:border-mostaza-500"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mostaza-100 text-ink-900">
                    <Plus className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="text-sm font-extrabold">Nueva sección</span>
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
        className="relative aspect-[4/5] overflow-hidden p-0 shadow-sm"
        style={{ backgroundColor: section.accentColor }}
      >
        {section.coverImageUrl ? (
          <Image
            src={section.coverImageUrl}
            alt=""
            fill
            sizes="50vw"
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>
            🍽️
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-3">
          <h2 className="line-clamp-2 text-base font-extrabold text-white">{section.name}</h2>
          <p className="mt-0.5 text-xs font-semibold text-white/90">
            {itemCount === 0
              ? 'Sin platillos'
              : itemCount === 1
                ? '1 platillo'
                : `${itemCount} platillos`}
          </p>
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
              <GripVertical className="h-5 w-5" aria-hidden />
            </span>
          </button>
        ) : (
          <>
            <Link href={`/menu/s/${section.id}`} className="absolute inset-0" aria-label={section.name} />
            <Link
              href={`/menu/sections/${section.id}/edit`}
              className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-md bg-white/90 text-ink-900 shadow-sm"
              aria-label={`Editar ${section.name}`}
            >
              <Settings2 className="h-4 w-4" aria-hidden />
            </Link>
          </>
        )}
      </Card>
    </li>
  );
}
