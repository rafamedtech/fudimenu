'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SaveIndicator, type SaveIndicatorStatus } from '@/components/ui/save-indicator';
import { Sheet } from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import {
  getQueuedOfflineMutation,
  keepLocalOfflineMutation,
  type JsonValue,
} from '@/lib/storage/offline-queue';
import { itemSchema, type ItemInput } from '@/lib/validators/item.schema';
import {
  restoreItemAction,
  softDeleteItemAction,
  toggleItemAvailabilityAction,
  upsertItemAction,
} from '@/server/actions/items.actions';
import { ApiError, toUserMessage } from '@/lib/api/errors';
import { track } from '@/lib/analytics/events';
import type { Category, MenuItem } from '@/types/domain';

interface Props {
  initial: MenuItem | null;
  categories: Category[];
}

export function ItemEditorForm({ initial, categories }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isStockPending, startStockTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveIndicatorStatus>('idle');
  const [conflictDraft, setConflictDraft] = useState<ItemInput | null>(null);
  const [conflictMutationId, setConflictMutationId] = useState<number | null>(null);
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
  const conflictRows = useMemo(
    () => buildConflictRows(initial, conflictDraft, categories),
    [categories, conflictDraft, initial],
  );

  useEffect(() => {
    const conflictId = Number(searchParams.get('offlineConflict'));
    if (!Number.isFinite(conflictId) || conflictId <= 0) return;

    let isMounted = true;

    getQueuedOfflineMutation(conflictId)
      .then((mutation) => {
        if (!isMounted || !mutation?.payload) return;
        const payload = mutation.payload;
        if (!isItemInputPayload(payload)) return;

        setConflictMutationId(conflictId);
        setConflictDraft(payload);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  async function onSubmit(data: ItemInput) {
    setSaveStatus('saving');

    try {
      const res = await upsertItemAction({
        ...data,
        categoryId: data.categoryId ?? fallbackCategoryId,
      });
      if (!res.ok) {
        setSaveStatus('idle');
        toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
        return;
      }

      if (res.ok) {
        setSaveStatus('saved');
        track(initial ? 'item_edited' : 'item_created', {
          itemId: res.item.id,
          field: 'all',
        } as never);
        router.push('/menu');
      }
    } catch (err) {
      setSaveStatus('idle');
      toast.error(toUserMessage(err, locale));
    }
  }

  function handleAvailabilityChange(next: boolean) {
    const previous = !!isAvailable;
    setValue('isAvailable', next, { shouldDirty: true });

    if (!initial?.id) return;

    track('stock_toggled', { itemId: initial.id, available: next });
    startStockTransition(async () => {
      try {
        const res = await toggleItemAvailabilityAction(initial.id, next);
        if (!res.ok) {
          setValue('isAvailable', previous, { shouldDirty: true });
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        toast.success(next ? 'Disponible' : 'Marcado agotado');
      } catch (err) {
        setValue('isAvailable', previous, { shouldDirty: true });
        toast.error(toUserMessage(err, locale));
      }
    });
  }

  function handleDelete() {
    if (!initial?.id) return;

    startDeleteTransition(async () => {
      try {
        const res = await softDeleteItemAction(initial.id);
        if (!res.ok) {
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        router.push('/menu');
        router.refresh();

        toast.success('Platillo eliminado', {
          duration: 5000,
          action: {
            label: 'Deshacer',
            onClick: async () => {
              try {
                const restoreRes = await restoreItemAction(initial.id);
                if (!restoreRes.ok) {
                  toast.error(toUserMessage(actionErrorToApiError(restoreRes.code), locale));
                  return;
                }

                toast.success('Platillo restaurado');
                router.refresh();
              } catch (err) {
                toast.error(toUserMessage(err, locale));
              }
            },
          },
        });
      } catch (err) {
        toast.error(toUserMessage(err, locale));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-4 pt-4">
      <SaveIndicator status={saveStatus} className="absolute right-0 top-1 z-10" />
      <Sheet
        open={!!conflictDraft}
        onOpenChange={(open) => {
          if (!open) setConflictDraft(null);
        }}
        title="Ver ambos"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-ink-700">
            Otro usuario guardó una versión nueva mientras estabas offline.
          </p>
          <div className="overflow-hidden rounded-md border border-ink-200">
            <div className="grid grid-cols-3 bg-crema-100 px-3 py-2 text-xs font-bold uppercase text-ink-500">
              <span>Campo</span>
              <span>Actual</span>
              <span>Tus cambios</span>
            </div>
            {conflictRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-3 gap-2 border-t border-ink-100 px-3 py-3 text-sm"
              >
                <span className="font-semibold text-ink-700">{row.label}</span>
                <span className="break-words text-ink-600">{row.current}</span>
                <span className="break-words font-semibold text-ink-900">{row.local}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                if (conflictMutationId) {
                  void keepLocalOfflineMutation(conflictMutationId);
                  setConflictDraft(null);
                  toast.info('Intentando guardar tus cambios');
                }
              }}
            >
              Mis cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setConflictDraft(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Sheet>

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

function isItemInputPayload(payload: JsonValue): payload is ItemInput {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload) &&
    typeof payload.name === 'string' &&
    typeof payload.priceCents === 'number'
  );
}

function actionErrorToApiError(code: 'unauthorized') {
  return new ApiError(401, code, 'Unauthorized');
}

function buildConflictRows(
  current: MenuItem | null,
  local: ItemInput | null,
  categories: Category[],
) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return [
    {
      label: 'Nombre',
      current: current?.name ?? '',
      local: local?.name ?? '',
    },
    {
      label: 'Precio',
      current: formatPrice(current?.priceCents, current?.currency),
      local: formatPrice(local?.priceCents, local?.currency),
    },
    {
      label: 'Categoría',
      current: current?.categoryId ? (categoryNames.get(current.categoryId) ?? 'Sin categoría') : 'Sin categoría',
      local: local?.categoryId ? (categoryNames.get(local.categoryId) ?? 'Sin categoría') : 'Sin categoría',
    },
    {
      label: 'Stock',
      current: current?.isAvailable ? 'Disponible' : 'Agotado',
      local: local?.isAvailable ? 'Disponible' : 'Agotado',
    },
    {
      label: 'Descripción',
      current: current?.description || 'Sin descripción',
      local: local?.description || 'Sin descripción',
    },
  ];
}

function formatPrice(priceCents?: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format((priceCents ?? 0) / 100);
}
