'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageUploadField } from '@/components/admin/image-upload-field';
import { Sheet } from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { usePriceInput } from '@/hooks/use-price-input';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import {
  getQueuedOfflineMutation,
  keepLocalOfflineMutation,
  type JsonValue,
} from '@/lib/storage/offline-queue';
import { cn } from '@/lib/utils';
import { itemSchema, type ItemInput } from '@/lib/validators/item.schema';
import {
  restoreItemAction,
  softDeleteItemAction,
  toggleItemAvailabilityAction,
  upsertItemAction,
} from '@/server/actions/items.actions';
import { upsertCategoryAction } from '@/server/actions/categories.actions';
import { ApiError, toUserMessage } from '@/lib/api/errors';
import { track } from '@/lib/analytics/events';
import type { Category, MenuItem } from '@/types/domain';

interface Props {
  initial: MenuItem | null;
  categories: Category[];
  sectionId?: string | null;
}

const DESCRIPTION_MAX_CHARS = 500;

export function ItemEditorForm({ initial, categories, sectionId }: Props) {
  const locale = useLocale();
  const t = useTranslations('menu');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isStockPending, startStockTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isCategoryPending, startCategoryTransition] = useTransition();
  const [stockAvailable, setStockAvailable] = useState(initial?.isAvailable ?? true);
  const [conflictDraft, setConflictDraft] = useState<ItemInput | null>(null);
  const [conflictMutationId, setConflictMutationId] = useState<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [localCategories, setLocalCategories] = useState(categories);
  const fallbackCategoryId = localCategories[0]?.id ?? null;
  const initialCategoryId =
    initial?.categoryId && localCategories.some((category) => category.id === initial.categoryId)
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
      isSpecialToday: initial?.isSpecialToday ?? false,
      specialPrice: initial?.specialPrice ?? null,
    },
  });

  const { displayValue: priceDisplayValue, handleChange: handlePriceChange } = usePriceInput(
    initial?.priceCents ?? 0,
    (cents) => setValue('priceCents', cents, { shouldDirty: true, shouldValidate: true }),
  );
  const {
    displayValue: specialPriceDisplayValue,
    handleChange: handleSpecialPriceChange,
  } = usePriceInput(
    initial?.specialPrice ?? 0,
    (cents) => setValue('specialPrice', cents > 0 ? cents : null, {
      shouldDirty: true,
      shouldValidate: true,
    }),
  );
  const description = watch('description') ?? '';
  const charCount = description.length;
  const isNearDescriptionLimit = charCount > DESCRIPTION_MAX_CHARS * 0.9;
  const selectedCategoryId = watch('categoryId');
  const selectedCategory = localCategories.find((category) => category.id === selectedCategoryId);
  const placeholderEmoji = getCategoryEmoji(selectedCategory?.name);
  const imageUrl = watch('imageUrl');
  const isSpecialToday = watch('isSpecialToday') ?? false;
  const conflictRows = useMemo(
    () => buildConflictRows(initial, conflictDraft, localCategories),
    [localCategories, conflictDraft, initial],
  );

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (localCategories.length > 0) {
      setValue('categoryId', localCategories[0].id, { shouldDirty: true, shouldValidate: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCategories.length]);

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
    try {
      const res = await upsertItemAction({
        ...data,
        categoryId: data.categoryId ?? fallbackCategoryId,
        ...(!initial?.id ? { isAvailable: stockAvailable } : {}),
      });
      if (!res.ok) {
        toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
        return;
      }

      if (res.ok) {
        track(initial ? 'item_edited' : 'item_created', {
          itemId: res.item.id,
          field: 'all',
        } as never);
        toast.success('✓ Guardado');
        router.push(sectionId ? `/menu/s/${sectionId}` : '/menu');
      }
    } catch (err) {
      toast.error(toUserMessage(err, locale));
    }
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    const activeSectionId = sectionId ?? searchParams.get('sectionId');
    startCategoryTransition(async () => {
      const res = await upsertCategoryAction({
        name: newCategoryName.trim(),
        sectionId: activeSectionId ?? null,
      });
      if (!res.ok) {
        toast.error('No se pudo crear la categoría');
        return;
      }
      setLocalCategories((prev) => [...prev, res.category]);
      setValue('categoryId', res.category.id, { shouldDirty: true, shouldValidate: true });
      toast.success('Categoría creada');
      setShowCategoryForm(false);
      setNewCategoryName('');
      router.refresh();
    });
  }

  function handleAvailabilityChange(next: boolean) {
    const previous = stockAvailable;
    setStockAvailable(next);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);

    if (!initial?.id) {
      toast.success(next ? t('available') : t('soldOut'));
      return;
    }

    track('stock_toggled', { itemId: initial.id, available: next });
    startStockTransition(async () => {
      try {
        const res = await toggleItemAvailabilityAction(initial.id, next);
        if (!res.ok) {
          setStockAvailable(previous);
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        toast.success(next ? t('available') : t('soldOut'));
      } catch (err) {
        setStockAvailable(previous);
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

        router.push(sectionId ? `/menu/s/${sectionId}` : '/menu');
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
    <div className="flex flex-col gap-5 pt-4">
      <Card className="border border-mostaza-300 bg-mostaza-50 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-ink-900">Disponible para clientes</p>
            <p className="text-xs text-ink-500">
              {initial?.id
                ? 'Se actualiza al instante en el menú público'
                : 'Se aplicará cuando guardes el platillo'}
            </p>
          </div>
          <Toggle
            checked={stockAvailable}
            onChange={handleAvailabilityChange}
            disabled={isStockPending}
            ariaLabel="Disponible para clientes"
          />
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-4">
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

      <ImageUploadField
        kind="item"
        label="Foto opcional"
        value={imageUrl}
        onChange={(url) => setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true })}
        fallback={<span className="text-6xl" aria-hidden>{placeholderEmoji}</span>}
      />

      <Input
        label="Nombre del platillo"
        placeholder="Ej: Tacos al pastor"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700" htmlFor="categoryId">
          Categoría
        </label>
        {localCategories.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-md border border-ink-200 bg-crema-50 p-4">
            <p className="text-sm text-ink-700">Crea categoría primero</p>
            {!showCategoryForm ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCategoryForm(true)}
              >
                Crear categoría
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Input
                  label="Nombre de categoría"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Tacos"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={handleCreateCategory}
                    loading={isCategoryPending}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCategoryForm(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : localCategories.length === 1 ? (
          <div className="flex h-14 items-center rounded-md border-[1.5px] border-ink-300 bg-crema-50 px-4 text-base text-ink-900">
            {localCategories[0].name}
          </div>
        ) : (
          <>
            <select
              id="categoryId"
              required
              className="h-14 w-full rounded-md border-[1.5px] border-ink-300 bg-white px-4 text-base text-ink-900 outline-none focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
              {...register('categoryId')}
            >
              {localCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId?.message && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </>
        )}
      </div>

      <Input
        label="Precio"
        type="text"
        prefix="$"
        inputMode="decimal"
        placeholder="0"
        error={errors.priceCents?.message}
        value={priceDisplayValue}
        onChange={(e) => handlePriceChange(e.target.value)}
      />

      <Card className="space-y-3 border border-coral-500/20 bg-coral-50 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-ink-900">Especial de hoy</p>
            <p className="text-xs text-ink-500">Aparece arriba en el menú público.</p>
          </div>
          <Toggle
            checked={isSpecialToday}
            onChange={(next) => setValue('isSpecialToday', next, { shouldDirty: true })}
            ariaLabel="Especial de hoy"
          />
        </div>
        {isSpecialToday && (
          <Input
            label="Precio especial"
            type="text"
            prefix="$"
            inputMode="decimal"
            placeholder="Opcional"
            value={specialPriceDisplayValue}
            onChange={(event) => handleSpecialPriceChange(event.target.value)}
          />
        )}
      </Card>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</label>
        <textarea
          {...register('description')}
          rows={4}
          maxLength={DESCRIPTION_MAX_CHARS}
          placeholder="¿Qué lleva? ¿Por qué les va a encantar?"
          className="w-full rounded-md border-[1.5px] border-ink-300 bg-white p-4 text-base text-ink-900 outline-none placeholder:text-ink-500 focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
        />
        <div className="mt-1 flex justify-end">
          <span
            className={cn(
              'text-xs tabular-nums',
              isNearDescriptionLimit ? 'font-bold text-coral-500' : 'text-ink-500',
              charCount === DESCRIPTION_MAX_CHARS && 'text-red-500',
            )}
          >
            {charCount}/{DESCRIPTION_MAX_CHARS}
          </span>
        </div>
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
        {!showCategoryForm && (
          <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
            Guardar
          </Button>
        )}
      </div>
      </form>
    </div>
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

function actionErrorToApiError(code: string) {
  return code === 'rate_limited'
    ? new ApiError(429, code, 'Rate limited')
    : new ApiError(401, code, 'Unauthorized');
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
