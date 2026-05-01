'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { itemSchema, type ItemInput } from '@/lib/validators/item.schema';
import {
  restoreItemAction,
  softDeleteItemAction,
  toggleItemAvailabilityAction,
  upsertItemAction,
} from '@/server/actions/items.actions';
import { toUserMessage } from '@/lib/api/errors';
import { track } from '@/lib/analytics/events';
import type { Category, MenuItem } from '@/types/domain';

interface Props {
  initial: MenuItem | null;
  categories: Category[];
}

export function ItemEditorForm({ initial, categories }: Props) {
  const router = useRouter();
  const [isStockPending, startStockTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackCategoryId = categories[0]?.id ?? null;
  const initialCategoryId =
    initial?.categoryId && categories.some((category) => category.id === initial.categoryId)
      ? initial.categoryId
      : fallbackCategoryId;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      id: initial?.id,
      categoryId: initialCategoryId,
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      priceCents: initial?.priceCents ?? 0,
      currency: initial?.currency ?? 'MXN',
      imageUrl: initial?.imageUrl ?? null,
      isAvailable: initial?.isAvailable ?? true,
    },
  });

  const isAvailable = watch('isAvailable');
  const priceCents = watch('priceCents');
  const selectedCategoryId = watch('categoryId');
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const placeholderEmoji = getCategoryEmoji(selectedCategory?.name);

  useEffect(() => {
    return () => {
      if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    };
  }, []);

  function clearSaveStatusTimer() {
    if (saveStatusTimerRef.current) {
      clearTimeout(saveStatusTimerRef.current);
      saveStatusTimerRef.current = null;
    }
  }

  function showSavedIndicator() {
    clearSaveStatusTimer();
    setSaveStatus('saved');
    saveStatusTimerRef.current = setTimeout(() => {
      setSaveStatus('idle');
      saveStatusTimerRef.current = null;
    }, 1000);
  }

  async function onSubmit(data: ItemInput) {
    clearSaveStatusTimer();
    setSaveStatus('saving');

    try {
      const res = await upsertItemAction({
        ...data,
        categoryId: data.categoryId ?? fallbackCategoryId,
      });
      if (res.ok) {
        showSavedIndicator();
        track(initial ? 'item_edited' : 'item_created', {
          itemId: res.item.id,
          field: 'all',
        } as never);
        router.push('/menu');
      }
    } catch (err) {
      setSaveStatus('idle');
      toast.error(toUserMessage(err));
    }
  }

  function handleAvailabilityChange(next: boolean) {
    const previous = !!isAvailable;
    setValue('isAvailable', next, { shouldDirty: true });

    if (!initial?.id) return;

    track('stock_toggled', { itemId: initial.id, available: next });
    startStockTransition(async () => {
      try {
        await toggleItemAvailabilityAction(initial.id, next);
        toast.success(next ? 'Disponible' : 'Marcado agotado');
      } catch (err) {
        setValue('isAvailable', previous, { shouldDirty: true });
        toast.error(toUserMessage(err));
      }
    });
  }

  function handleDelete() {
    if (!initial?.id) return;

    startDeleteTransition(async () => {
      try {
        await softDeleteItemAction(initial.id);
        router.push('/menu');
        router.refresh();

        toast.success('Platillo eliminado', {
          duration: 5000,
          action: {
            label: 'Deshacer',
            onClick: async () => {
              try {
                await restoreItemAction(initial.id);
                toast.success('Platillo restaurado');
                router.refresh();
              } catch (err) {
                toast.error(toUserMessage(err));
              }
            },
          },
        });
      } catch (err) {
        toast.error(toUserMessage(err));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-4 pt-4">
      {saveStatus !== 'idle' && (
        <div
          className="absolute right-0 top-1 z-10 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-700 shadow-sm ring-1 ring-ink-100"
          role="status"
          aria-live="polite"
        >
          {saveStatus === 'saving' ? 'Guardando...' : '✓'}
        </div>
      )}

      <div className="flex items-center justify-between rounded-md bg-white p-4 shadow-sm">
        <div>
          <p className="font-semibold">Stock</p>
          <p className="text-xs text-ink-500">
            {initial?.id ? 'Cambia al instante, sin guardar' : 'Se aplicará al guardar'}
          </p>
        </div>
        <Toggle
          checked={!!isAvailable}
          onChange={handleAvailabilityChange}
          disabled={isStockPending}
          ariaLabel="Disponible"
        />
      </div>

      <button
        type="button"
        className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-lg bg-crema-100 text-ink-500"
        onClick={() => toast.info('Upload conectado a Cloudinary próximamente')}
      >
        <span className="text-6xl" aria-hidden>
          {placeholderEmoji}
        </span>
        <span className="text-sm font-semibold text-ink-700">Foto opcional</span>
      </button>

      <Input
        label="Nombre"
        placeholder="Ej: Tacos al pastor"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700" htmlFor="categoryId">
          Categoría
        </label>
        <select
          id="categoryId"
          required={categories.length > 0}
          disabled={categories.length === 0}
          className="h-14 w-full rounded-md border-[1.5px] border-ink-300 bg-white px-4 text-base text-ink-900 outline-none focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza disabled:cursor-not-allowed disabled:bg-crema-100 disabled:text-ink-500"
          {...register('categoryId')}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
        )}
      </div>

      <Input
        label="Precio"
        type="number"
        prefix="$"
        inputMode="numeric"
        placeholder="0"
        error={errors.priceCents?.message}
        value={(priceCents ?? 0) / 100}
        onChange={(e) => setValue('priceCents', Math.round(Number(e.target.value) * 100))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="¿Qué lleva? ¿Por qué les va a encantar?"
          className="w-full rounded-md border-[1.5px] border-ink-300 bg-white p-4 text-base text-ink-900 outline-none placeholder:text-ink-500 focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
        />
      </div>

      <div className="sticky bottom-[88px] mt-4 flex gap-3">
        {initial?.id && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            aria-label="Eliminar platillo"
            loading={isDeletePending}
            onClick={handleDelete}
          >
            <Trash2 aria-hidden="true" className="h-5 w-5" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
