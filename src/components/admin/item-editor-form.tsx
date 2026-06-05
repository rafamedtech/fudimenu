'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useReducer, useRef, useTransition } from 'react';
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { toast } from 'sonner';
import { PLAN_CONFIG } from '@/config/plans';
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
import { cn, formatPrice } from '@/lib/utils';
import {
  ALLERGEN_TAGS,
  DIETARY_TAGS,
  type AllergenTag,
  type DietaryTag,
} from '@/lib/item-attributes';
import { MAX_VARIANT_NAME_CHARS, MAX_VARIANTS_PER_ITEM } from '@/lib/item-variants';
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
import type { Category, Locale, MenuItem } from '@/types/domain';

interface Props {
  initial: MenuItem | null;
  categories: Category[];
  sectionId?: string | null;
  offlineConflictId?: number;
  defaultLocale: Locale;
}

const DESCRIPTION_MAX_CHARS = 500;
const FREE_ITEM_LIMIT = PLAN_CONFIG.free.limits.items ?? 20;
const LOCALE_LABEL: Record<Locale, string> = { es: 'Español', en: 'Inglés' };

const DIETARY_LABEL: Record<DietaryTag, string> = {
  vegan: 'Vegano',
  vegetarian: 'Vegetariano',
  gluten_free: 'Sin gluten',
  spicy: 'Picante',
};
const ALLERGEN_LABEL: Record<AllergenTag, string> = {
  dairy: 'Lácteos',
  nuts: 'Nueces',
  peanuts: 'Cacahuate',
  gluten: 'Gluten',
  shellfish: 'Mariscos',
  fish: 'Pescado',
  eggs: 'Huevo',
  soy: 'Soya',
  sesame: 'Ajonjolí',
};

export function ItemEditorForm({ initial, categories, sectionId, offlineConflictId, defaultLocale }: Props) {
  const locale = useLocale();
  const t = useTranslations('menu');
  const router = useRouter();
  const [isStockPending, startStockTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isCategoryPending, startCategoryTransition] = useTransition();
  const [stockAvailable, setStockAvailable] = useReducer((_: boolean, next: boolean) => next, initial?.isAvailable ?? true);
  const [conflictDraft, setConflictDraft] = useReducer((_: ItemInput | null, next: ItemInput | null) => next, null);
  const conflictMutationIdRef = useRef<number | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useReducer((_: boolean, next: boolean) => next, false);
  const [showUpgradeModal, setShowUpgradeModal] = useReducer((_: boolean, next: boolean) => next, false);
  const [newCategoryName, setNewCategoryName] = useReducer((_: string, next: string) => next, '');
  const [localCategories, setLocalCategories] = useReducer(
    (_: Category[], next: Category[]) => next,
    categories,
  );
  const translationLocale: Locale = defaultLocale === 'es' ? 'en' : 'es';
  const initialTranslation = initial?.translations?.find((t) => t.locale === translationLocale);
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
    control,
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
      dietaryTags: (initial?.dietaryTags ?? []) as DietaryTag[],
      allergenTags: (initial?.allergenTags ?? []) as AllergenTag[],
      scheduleDays: initial?.scheduleDays ?? [],
      scheduleStartMinute: initial?.scheduleStartMinute ?? null,
      scheduleEndMinute: initial?.scheduleEndMinute ?? null,
      variants: (initial?.variants ?? []).map((variant) => ({
        name: variant.name,
        priceCents: variant.priceCents,
      })),
      translations: [
        {
          locale: translationLocale,
          name: initialTranslation?.name ?? '',
          description: initialTranslation?.description ?? '',
        },
      ],
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
  const dietaryTags = watch('dietaryTags') ?? [];
  const allergenTags = watch('allergenTags') ?? [];

  function toggleDietaryTag(tag: DietaryTag) {
    const next = dietaryTags.includes(tag)
      ? dietaryTags.filter((t) => t !== tag)
      : [...dietaryTags, tag];
    setValue('dietaryTags', next, { shouldDirty: true, shouldValidate: true });
  }

  function toggleAllergenTag(tag: AllergenTag) {
    const next = allergenTags.includes(tag)
      ? allergenTags.filter((t) => t !== tag)
      : [...allergenTags, tag];
    setValue('allergenTags', next, { shouldDirty: true, shouldValidate: true });
  }

  const scheduleDays = watch('scheduleDays') ?? [];
  const scheduleStartMinute = watch('scheduleStartMinute') ?? null;
  const scheduleEndMinute = watch('scheduleEndMinute') ?? null;

  function toggleScheduleDay(day: number) {
    const next = scheduleDays.includes(day)
      ? scheduleDays.filter((d) => d !== day)
      : [...scheduleDays, day].sort((a, b) => a - b);
    setValue('scheduleDays', next, { shouldDirty: true, shouldValidate: true });
  }

  function setScheduleMinute(field: 'scheduleStartMinute' | 'scheduleEndMinute', minute: number | null) {
    setValue(field, minute, { shouldDirty: true, shouldValidate: true });
  }
  const conflictRows = useMemo(
    () => buildConflictRows(initial, conflictDraft, localCategories),
    [localCategories, conflictDraft, initial],
  );

  useEffect(() => {
    const conflictId = offlineConflictId;
    if (typeof conflictId !== 'number' || !Number.isFinite(conflictId) || conflictId <= 0) return;

    let isMounted = true;

    getQueuedOfflineMutation(conflictId)
      .then((mutation) => {
        if (!isMounted || !mutation?.payload) return;
        const payload = mutation.payload;
        if (!isItemInputPayload(payload)) return;

        conflictMutationIdRef.current = conflictId;
        setConflictDraft(payload);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [offlineConflictId]);

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
      if (err instanceof Error && err.message === 'free_item_limit_reached') {
        setShowUpgradeModal(true);
        return;
      }
      toast.error(toUserMessage(err, locale));
    }
  }

  function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    startCategoryTransition(async () => {
      const res = await upsertCategoryAction({
        name: newCategoryName.trim(),
        sectionId: sectionId ?? null,
      });
      if (!res.ok) {
        toast.error('No se pudo crear la categoría');
        return;
      }
      setLocalCategories([...localCategories, res.category]);
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
      <StockAvailabilityCard
        isExistingItem={Boolean(initial?.id)}
        available={stockAvailable}
        disabled={isStockPending}
        onChange={handleAvailabilityChange}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="relative flex flex-col gap-4">
        <ConflictReviewSheet
          open={Boolean(conflictDraft)}
          rows={conflictRows}
          onOpenChange={(open) => {
            if (!open) setConflictDraft(null);
          }}
          keepLocalChanges={() => {
            if (!conflictMutationIdRef.current) return;
            void keepLocalOfflineMutation(conflictMutationIdRef.current);
            setConflictDraft(null);
            toast.info('Intentando guardar tus cambios');
          }}
        />

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

        <CategoryPicker
          categories={localCategories}
          selectedCategoryId={selectedCategoryId}
          error={errors.categoryId?.message}
          showForm={showCategoryForm}
          setShowForm={setShowCategoryForm}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          createCategory={handleCreateCategory}
          isPending={isCategoryPending}
          selectCategory={(categoryId) => setValue('categoryId', categoryId, { shouldValidate: true })}
        />

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

        <SpecialPriceCard
          isSpecialToday={isSpecialToday}
          setIsSpecialToday={(next) => setValue('isSpecialToday', next, { shouldDirty: true })}
          displayValue={specialPriceDisplayValue}
          handleChange={handleSpecialPriceChange}
        />

        <DescriptionField
          register={register}
          charCount={charCount}
          isNearLimit={isNearDescriptionLimit}
        />

        <AttributesCard
          dietaryTags={dietaryTags}
          allergenTags={allergenTags}
          onToggleDietary={toggleDietaryTag}
          onToggleAllergen={toggleAllergenTag}
        />

        <ScheduleCard
          days={scheduleDays}
          startMinute={scheduleStartMinute}
          endMinute={scheduleEndMinute}
          onToggleDay={toggleScheduleDay}
          onChangeStart={(m) => setScheduleMinute('scheduleStartMinute', m)}
          onChangeEnd={(m) => setScheduleMinute('scheduleEndMinute', m)}
          endError={errors.scheduleEndMinute?.message}
        />

        <VariantsCard register={register} control={control} setValue={setValue} />

        <TranslationCard
          register={register}
          localeLabel={LOCALE_LABEL[translationLocale]}
          localeCode={translationLocale.toUpperCase()}
        />

        <ItemEditorActions
          deleteAction={initial?.id ? { pending: isDeletePending, run: handleDelete } : undefined}
          submitAction={!showCategoryForm ? { pending: isSubmitting } : undefined}
          cancel={() => router.back()}
        />
      </form>

      {showUpgradeModal && <ItemLimitDialog close={() => setShowUpgradeModal(false)} />}
    </div>
  );
}

function ItemEditorActions({
  deleteAction,
  submitAction,
  cancel,
}: {
  deleteAction?: { pending: boolean; run: () => void };
  submitAction?: { pending: boolean };
  cancel: () => void;
}) {
  return (
    <div className="sticky bottom-[88px] mt-4 flex gap-3">
      {deleteAction && (
        <Button
          type="button"
          variant="destructive"
          size="lg"
          aria-label="Eliminar platillo"
          loading={deleteAction.pending}
          onClick={deleteAction.run}
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </Button>
      )}
      <Button type="button" variant="outline" size="lg" className="flex-1" onClick={cancel}>
        Cancelar
      </Button>
      {submitAction && (
        <Button type="submit" size="lg" className="flex-1" loading={submitAction.pending}>
          Guardar
        </Button>
      )}
    </div>
  );
}

function StockAvailabilityCard({
  isExistingItem,
  available,
  disabled,
  onChange,
}: {
  isExistingItem: boolean;
  available: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Card className="border border-mostaza-300 bg-mostaza-50 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-ink-900">Disponible para clientes</p>
          <p className="text-xs text-ink-500">
            {isExistingItem
              ? 'Se actualiza al instante en el menú público'
              : 'Se aplicará cuando guardes el platillo'}
          </p>
        </div>
        <Toggle
          checked={available}
          onChange={onChange}
          disabled={disabled}
          ariaLabel="Disponible para clientes"
        />
      </div>
    </Card>
  );
}

function ConflictReviewSheet({
  open,
  rows,
  onOpenChange,
  keepLocalChanges,
}: {
  open: boolean;
  rows: ReturnType<typeof buildConflictRows>;
  onOpenChange: (open: boolean) => void;
  keepLocalChanges: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Ver ambos">
      <div className="space-y-4">
        <p className="text-sm leading-6 text-ink-700">
          Otro usuario guardó una versión nueva mientras estabas offline.
        </p>
        <div className="overflow-hidden rounded-md border border-ink-200">
          <div className="grid grid-cols-3 bg-[var(--brand-surface-strong)] px-3 py-2 text-xs font-bold uppercase text-ink-500">
            <span>Campo</span>
            <span>Actual</span>
            <span>Tus cambios</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 gap-2 border-t border-ink-100 p-3 text-sm"
            >
              <span className="font-semibold text-ink-700">{row.label}</span>
              <span className="break-words text-ink-600">{row.current}</span>
              <span className="break-words font-semibold text-ink-900">{row.local}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" className="flex-1" onClick={keepLocalChanges}>
            Mis cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function CategoryPicker({
  categories,
  selectedCategoryId,
  error,
  showForm,
  setShowForm,
  newCategoryName,
  setNewCategoryName,
  createCategory,
  isPending,
  selectCategory,
}: {
  categories: Category[];
  selectedCategoryId?: string | null;
  error?: string;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  createCategory: () => void;
  isPending: boolean;
  selectCategory: (categoryId: string) => void;
}) {
  return (
    <div>
      <p id="category-label" className="mb-1.5 block text-sm font-medium text-ink-700">
        Categoría
      </p>
      {categories.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-md border border-ink-200 bg-[var(--brand-surface)] p-4">
          <p className="text-sm text-ink-700">Crea categoría primero</p>
          {!showForm ? (
            <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
              Crear categoría
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <Input
                label="Nombre de categoría"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Ej: Tacos"
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="button" className="flex-1" onClick={createCategory} loading={isPending}>
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setNewCategoryName('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : categories.length === 1 ? (
        <div className="flex h-14 items-center rounded-md border-[1.5px] border-ink-300 bg-[var(--brand-surface)] px-4 text-base text-ink-900">
          {categories[0].name}
        </div>
      ) : (
        <>
          <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="radio"
                aria-checked={selectedCategoryId === category.id}
                onClick={() => selectCategory(category.id)}
                className={cn(
                  'rounded-full border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedCategoryId === category.id
                    ? 'border-mostaza-500 bg-mostaza-100 text-mostaza-800'
                    : 'border-ink-300 bg-[var(--brand-card)] text-ink-700 hover:border-mostaza-400 hover:bg-[var(--brand-surface)]',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}

function SpecialPriceCard({
  isSpecialToday,
  setIsSpecialToday,
  displayValue,
  handleChange,
}: {
  isSpecialToday: boolean;
  setIsSpecialToday: (isSpecial: boolean) => void;
  displayValue: string;
  handleChange: (value: string) => void;
}) {
  return (
    <Card className="space-y-3 border border-coral-500/20 bg-coral-50 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-ink-900">Especial de hoy</p>
          <p className="text-xs text-ink-500">Aparece arriba en el menú público.</p>
        </div>
        <Toggle
          checked={isSpecialToday}
          onChange={setIsSpecialToday}
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
          value={displayValue}
          onChange={(event) => handleChange(event.target.value)}
        />
      )}
    </Card>
  );
}

function DescriptionField({
  register,
  charCount,
  isNearLimit,
}: {
  register: UseFormRegister<ItemInput>;
  charCount: number;
  isNearLimit: boolean;
}) {
  return (
    <div>
      <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-ink-700">
        Descripción
      </label>
      <textarea
        {...register('description')}
        id="description"
        rows={4}
        maxLength={DESCRIPTION_MAX_CHARS}
        placeholder="¿Qué lleva? ¿Por qué les va a encantar?"
        className="w-full rounded-md border-[1.5px] border-ink-300 bg-[var(--brand-card)] p-4 text-base text-ink-900 outline-none placeholder:text-ink-500 focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
      />
      <div className="mt-1 flex justify-end">
        <span
          className={cn(
            'text-xs tabular-nums',
            isNearLimit ? 'font-bold text-coral-500' : 'text-ink-500',
            charCount === DESCRIPTION_MAX_CHARS && 'text-red-500',
          )}
        >
          {charCount}/{DESCRIPTION_MAX_CHARS}
        </span>
      </div>
    </div>
  );
}

function AttributesCard({
  dietaryTags,
  allergenTags,
  onToggleDietary,
  onToggleAllergen,
}: {
  dietaryTags: string[];
  allergenTags: string[];
  onToggleDietary: (tag: DietaryTag) => void;
  onToggleAllergen: (tag: AllergenTag) => void;
}) {
  return (
    <Card className="space-y-4 border border-ink-200 bg-[var(--brand-surface)] shadow-sm">
      <div>
        <p className="font-bold text-ink-900">Dietas y alérgenos</p>
        <p className="text-xs text-ink-500">
          Opcional. Se muestra a tus clientes como etiquetas. Tú administras esta información.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Dieta</legend>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((tag) => (
            <TagToggle
              key={tag}
              label={DIETARY_LABEL[tag]}
              selected={dietaryTags.includes(tag)}
              onClick={() => onToggleDietary(tag)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Contiene alérgenos</legend>
        <div className="flex flex-wrap gap-2">
          {ALLERGEN_TAGS.map((tag) => (
            <TagToggle
              key={tag}
              label={ALLERGEN_LABEL[tag]}
              selected={allergenTags.includes(tag)}
              onClick={() => onToggleAllergen(tag)}
            />
          ))}
        </div>
      </fieldset>
    </Card>
  );
}

// 0=Sun…6=Sat (matches DB/`getDay`), shown Monday-first for MX convention.
const SCHEDULE_DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

function minuteToTimeValue(minute: number | null): string {
  if (minute == null) return '';
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeValueToMinute(value: string): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function ScheduleCard({
  days,
  startMinute,
  endMinute,
  onToggleDay,
  onChangeStart,
  onChangeEnd,
  endError,
}: {
  days: number[];
  startMinute: number | null;
  endMinute: number | null;
  onToggleDay: (day: number) => void;
  onChangeStart: (minute: number | null) => void;
  onChangeEnd: (minute: number | null) => void;
  endError?: string;
}) {
  return (
    <Card className="space-y-4 border border-ink-200 bg-[var(--brand-surface)] shadow-sm">
      <div>
        <p className="font-bold text-ink-900">Horario de visibilidad</p>
        <p className="text-xs text-ink-500">
          Opcional. Controla cuándo aparece este platillo en tu menú público. No
          afecta disponibilidad ni inventario. Sin selección = siempre visible.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">
          Días (vacío = todos)
        </legend>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_DAYS.map((day) => (
            <TagToggle
              key={day.value}
              label={day.label}
              selected={days.includes(day.value)}
              onClick={() => onToggleDay(day.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">
          Horas (vacío = todo el día)
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Desde</span>
            <input
              type="time"
              value={minuteToTimeValue(startMinute)}
              onChange={(e) => onChangeStart(timeValueToMinute(e.target.value))}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Hasta</span>
            <input
              type="time"
              value={minuteToTimeValue(endMinute)}
              onChange={(e) => onChangeEnd(timeValueToMinute(e.target.value))}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
        </div>
        {endError && <p className="mt-1.5 text-sm text-red-600">{endError}</p>}
      </fieldset>
    </Card>
  );
}

function TagToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'rounded-full border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors',
        selected
          ? 'border-mostaza-500 bg-mostaza-100 text-mostaza-800'
          : 'border-ink-300 bg-[var(--brand-card)] text-ink-700 hover:border-mostaza-400 hover:bg-[var(--brand-surface)]',
      )}
    >
      {label}
    </button>
  );
}

function VariantsCard({
  register,
  control,
  setValue,
}: {
  register: UseFormRegister<ItemInput>;
  control: Control<ItemInput>;
  setValue: UseFormSetValue<ItemInput>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
  const atLimit = fields.length >= MAX_VARIANTS_PER_ITEM;

  return (
    <Card className="space-y-4 border border-ink-200 bg-[var(--brand-surface)] shadow-sm">
      <div>
        <p className="font-bold text-ink-900">Variantes</p>
        <p className="text-xs text-ink-500">
          Opcional. Opciones del mismo platillo con su propio precio (ej. Chico / Grande). Solo
          nombre y precio — el orden es el de la lista.
        </p>
      </div>

      {fields.length > 0 && (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <VariantRow
              key={field.id}
              index={index}
              defaultPriceCents={field.priceCents ?? 0}
              register={register}
              setValue={setValue}
              onRemove={() => remove(index)}
            />
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={atLimit}
        onClick={() => append({ name: '', priceCents: 0 })}
      >
        + Agregar variante
      </Button>
      {atLimit && (
        <p className="text-xs text-ink-500">Máximo {MAX_VARIANTS_PER_ITEM} variantes.</p>
      )}
    </Card>
  );
}

function VariantRow({
  index,
  defaultPriceCents,
  register,
  setValue,
  onRemove,
}: {
  index: number;
  defaultPriceCents: number;
  register: UseFormRegister<ItemInput>;
  setValue: UseFormSetValue<ItemInput>;
  onRemove: () => void;
}) {
  const { displayValue, handleChange } = usePriceInput(defaultPriceCents, (cents) =>
    setValue(`variants.${index}.priceCents`, cents, { shouldDirty: true, shouldValidate: true }),
  );

  return (
    <li className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label="Nombre"
          placeholder="Ej: Grande"
          maxLength={MAX_VARIANT_NAME_CHARS}
          {...register(`variants.${index}.name`)}
        />
      </div>
      <div className="w-28">
        <Input
          label="Precio"
          type="text"
          prefix="$"
          inputMode="decimal"
          placeholder="0"
          value={displayValue}
          onChange={(event) => handleChange(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        aria-label="Quitar variante"
        onClick={onRemove}
        className="mb-0.5"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
    </li>
  );
}

function TranslationCard({
  register,
  localeLabel,
  localeCode,
}: {
  register: UseFormRegister<ItemInput>;
  localeLabel: string;
  localeCode: string;
}) {
  return (
    <Card className="space-y-3 border border-ink-200 bg-[var(--brand-surface)] shadow-sm">
      <div>
        <p className="font-bold text-ink-900">
          Traducción ({localeCode})
        </p>
        <p className="text-xs text-ink-500">
          Opcional. Se muestra a clientes en {localeLabel}. Si lo dejas vacío, se usa el texto
          original.
        </p>
      </div>
      <input type="hidden" {...register('translations.0.locale')} />
      <Input
        label={`Nombre en ${localeLabel}`}
        placeholder="Ej: Al pastor tacos"
        {...register('translations.0.name')}
      />
      <div>
        <label
          htmlFor="translation-description"
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          Descripción en {localeLabel}
        </label>
        <textarea
          {...register('translations.0.description')}
          id="translation-description"
          rows={3}
          maxLength={DESCRIPTION_MAX_CHARS}
          placeholder="Traducción de la descripción"
          className="w-full rounded-md border-[1.5px] border-ink-300 bg-[var(--brand-card)] p-4 text-base text-ink-900 outline-none placeholder:text-ink-500 focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
        />
      </div>
    </Card>
  );
}

function ItemLimitDialog({ close }: { close: () => void }) {
  return (
    <dialog
      ref={(dialog) => {
        if (dialog && !dialog.open) dialog.showModal();
      }}
      className="fixed inset-0 z-50 m-0 flex size-full max-h-none max-w-none items-end bg-transparent px-4 pb-4 backdrop:bg-ink-900/45 backdrop:backdrop-blur-sm"
      aria-labelledby="upgrade-item-limit-title"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      onCancel={close}
    >
      <Card className="w-full space-y-4 rounded-lg border-[1.5px] border-mostaza-500 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
            <Lock className="size-5" />
          </div>
          <div>
            <h2 id="upgrade-item-limit-title" className="text-lg font-extrabold text-ink-900">
              Límite Free alcanzado
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-700">
              Tu menú ya tiene {FREE_ITEM_LIMIT} platillos. Sube a Pro para agregar items ilimitados,
              quitar la marca FudiMenu y activar analytics.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Ahora no
          </Button>
          <Link href="/settings/billing" className="flex-1">
            <Button type="button" className="w-full">
              Upgrade
            </Button>
          </Link>
        </div>
      </Card>
    </dialog>
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
      current: formatPrice(current?.priceCents ?? 0, current?.currency),
      local: formatPrice(local?.priceCents ?? 0, local?.currency),
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
