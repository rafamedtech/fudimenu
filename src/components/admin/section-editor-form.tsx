'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { resolveBrandSurfaceColor } from '@/lib/brand-theme';
import { refreshMenuPreview } from '@/lib/menu-preview';
import {
  softDeleteSectionAction,
  upsertSectionAction,
} from '@/server/actions/sections.actions';
import type { MenuSection } from '@/types/domain';

const ACCENT_COLORS = ['#FFF8E7', '#E7F8EF', '#FFE8E2', '#E9F0FF', '#F4E8FF', '#F8F8E7'];

interface SectionEditorFormProps {
  initial?: MenuSection | null;
  nextSortOrder?: number;
}

export function SectionEditorForm({ initial, nextSortOrder = 0 }: SectionEditorFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [accentColor, setAccentColor] = useState(initial?.accentColor ?? ACCENT_COLORS[0]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await upsertSectionAction({
        id: initial?.id,
        name: name.trim(),
        accentColor,
        coverImageUrl,
        sortOrder: initial?.sortOrder ?? nextSortOrder,
        isVisible: true,
      });

      if (!result.ok) {
        toast.error(
          result.error === 'free_section_limit_reached'
            ? 'Llegaste al límite de secciones Free'
            : 'No se pudo guardar la sección',
        );
        return;
      }

      refreshMenuPreview();
      toast.success('Guardado');
      router.push('/menu');
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial?.id) return;
    if (!window.confirm('¿Eliminar esta sección? Los platillos no se borran.')) return;

    startDeleteTransition(async () => {
      const result = await softDeleteSectionAction(initial.id);
      if (!result.ok) {
        toast.error('No se pudo eliminar la sección');
        return;
      }
      refreshMenuPreview();
      toast.success('Sección eliminada');
      router.push('/menu');
      router.refresh();
    });
  }

  return (
    <form
      className="flex flex-col gap-5 pt-4 ipad-landscape:grid ipad-landscape:grid-cols-[minmax(0,1fr)_360px] ipad-landscape:items-start ipad-landscape:gap-x-8"
      action={handleSave}
    >
      <Card
        className="relative aspect-[4/5] overflow-hidden p-0 shadow-sm ipad-landscape:sticky ipad-landscape:top-4 ipad-landscape:col-start-2 ipad-landscape:row-start-1"
        style={{ backgroundColor: resolveBrandSurfaceColor(accentColor) }}
      >
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 50vw"
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>
            🍽️
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 to-transparent p-4">
          <h2 className="text-2xl font-extrabold text-white">{name.trim() || 'Nombre sección'}</h2>
        </div>
      </Card>

      <div className="flex flex-col gap-5 ipad-landscape:col-start-1 ipad-landscape:row-start-1">
        <Input
          label="Nombre"
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Desayunos"
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-700">Color</p>
          <div className="grid grid-cols-6 gap-2">
            {ACCENT_COLORS.map((color) => (
              <Button
                key={color}
                type="button"
                variant="outline"
                aria-label={`Usar color ${color}`}
                aria-pressed={accentColor === color}
                className="h-12 rounded-md border-[1.5px] border-ink-200 ring-offset-2 transition-all aria-pressed:ring-2 aria-pressed:ring-mostaza-500"
                style={{ backgroundColor: color }}
                onClick={() => setAccentColor(color)}
              />
            ))}
          </div>
          <Input
            label="Hex personalizado"
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>

        <ImageUploadField
          kind="section"
          label="Cover"
          value={coverImageUrl}
          onChange={setCoverImageUrl}
        />
      </div>

      <div className="sticky bottom-[88px] flex gap-3 ipad-landscape:col-span-full ipad-landscape:bottom-4">
        {initial?.id && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            aria-label="Eliminar sección"
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
