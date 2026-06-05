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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useMemo, useReducer, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { StockToggle } from '@/components/admin/stock-toggle';
import { Button } from '@/components/ui/button';
import { reorderCategoriesAction } from '@/server/actions/categories.actions';
import { formatPrice } from '@/lib/utils';
import { TranslationStatusBadge } from '@/components/menu/translation-status-badge';
import type { Category, Locale, MenuItem } from '@/types/domain';

export type SectionCategoryGroup = {
  category: Category;
  items: MenuItem[];
};

export function SectionCategoryList({
  sectionId,
  groups,
  defaultLocale,
}: {
  sectionId: string;
  groups: SectionCategoryGroup[];
  defaultLocale: Locale;
}) {
  const [items, setItems] = useReducer((_: SectionCategoryGroup[], next: SectionCategoryGroup[]) => next, groups);
  const [reorderMode, setReorderMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );
  const ids = useMemo(() => items.map((item) => item.category.id), [items]);

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;

    const oldIndex = items.findIndex((item) => item.category.id === event.active.id);
    const newIndex = items.findIndex((item) => item.category.id === event.over?.id);
    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      const result = await reorderCategoriesAction({
        sectionId,
        categoryIds: next.map((item) => item.category.id),
      });
      if (!result.ok) {
        setItems(previous);
        toast.error('No se pudo reordenar');
        return;
      }
      toast.success('Orden guardado');
    });
  }

  return (
    <div className="flex flex-col gap-4 pt-4 ipad:gap-5">
      {items.length > 1 && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant={reorderMode ? 'secondary' : 'outline'}
            disabled={isPending}
            onClick={() => setReorderMode((value) => !value)}
          >
            <GripVertical className="size-4" aria-hidden />
            Reordenar
          </Button>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((group) => (
            <SortableCategoryGroup
              key={group.category.id}
              sectionId={sectionId}
              group={group}
              reorderMode={reorderMode}
              defaultLocale={defaultLocale}
            />
          ))}
        </SortableContext>
      </DndContext>
      <Link href={`/menu/categories/new?sectionId=${sectionId}`}>
        <Button type="button" variant="outline" className="w-full">
          + Nueva categoría
        </Button>
      </Link>
    </div>
  );
}

function SortableCategoryGroup({
  sectionId,
  group,
  reorderMode,
  defaultLocale,
}: {
  sectionId: string;
  group: SectionCategoryGroup;
  reorderMode: boolean;
  defaultLocale: Locale;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.category.id,
    disabled: !reorderMode,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-10 opacity-80' : undefined}
    >
      <div className="sticky top-14 z-10 mb-2 flex items-center justify-between gap-2 bg-[var(--brand-surface-translucent)] py-2 backdrop-blur ipad:top-16">
        <div className="flex items-center gap-2">
          {reorderMode && (
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-md bg-[var(--brand-card)] text-ink-700 shadow-sm"
              aria-label={`Mover ${group.category.name}`}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-5" aria-hidden />
            </button>
          )}
          {group.category.coverImageUrl && (
            <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-[var(--brand-primary-soft)]">
              <Image
                src={group.category.coverImageUrl}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          )}
          <h2 className="text-lg font-bold text-ink-900">{group.category.name}</h2>
        </div>
        {!reorderMode && (
          <Link
            href={`/menu/categories/${group.category.id}/edit?sectionId=${sectionId}`}
            className="text-sm font-bold text-ink-500"
          >
            Editar
          </Link>
        )}
      </div>
      <ul className="grid gap-2 ipad:grid-cols-2 ipad:gap-3 ipad-landscape:grid-cols-3 ipad-landscape:gap-4 desktop:grid-cols-4">
        {group.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-[var(--brand-card)] p-4 shadow-sm ipad:min-h-24"
          >
            <Link href={`/menu/${item.id}?sectionId=${sectionId}`} className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900">{item.name}</p>
              <p className="text-sm text-ink-500">{formatPrice(item.priceCents, item.currency)}</p>
              <div className="mt-1.5">
                <TranslationStatusBadge item={item} defaultLocale={defaultLocale} />
              </div>
            </Link>
            <StockToggle itemId={item.id} initial={item.isAvailable} />
          </li>
        ))}
      </ul>
    </section>
  );
}
