'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  softDeleteCategoryAction,
  upsertCategoryAction,
} from '@/server/actions/categories.actions';
import type { Category } from '@/types/domain';

interface CategoryEditorFormProps {
  initial?: Category | null;
  sectionId: string | null;
  nextSortOrder?: number;
}

export function CategoryEditorForm({
  initial,
  sectionId,
  nextSortOrder = 0,
}: CategoryEditorFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function returnPath() {
    return sectionId ? `/menu/s/${sectionId}` : '/menu';
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertCategoryAction({
        id: initial?.id,
        name: name.trim(),
        sectionId,
        sortOrder: initial?.sortOrder ?? nextSortOrder,
        isVisible: true,
      });

      if (!result.ok) {
        toast.error('No se pudo guardar la categoría');
        return;
      }

      toast.success('Categoría guardada');
      router.push(returnPath());
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm('¿Eliminar esta categoría? Sus platillos quedarán sin categoría.')) return;

    startDeleteTransition(async () => {
      const result = await softDeleteCategoryAction(initial.id);
      if (!result.ok) {
        toast.error('No se pudo eliminar la categoría');
        return;
      }
      toast.success('Categoría eliminada');
      router.push(returnPath());
      router.refresh();
    });
  }

  return (
    <form className="space-y-5 pt-4" action={handleSave}>
      <Input
        label="Nombre"
        required
        maxLength={40}
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ej: Tacos"
      />

      <div className="sticky bottom-[88px] flex gap-3">
        {initial?.id && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            aria-label="Eliminar categoría"
            loading={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-5" aria-hidden />
          </Button>
        )}
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={isPending} disabled={!name.trim()}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
