'use client';
import { useReducer, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Check, ChevronLeft, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usePriceInput } from '@/hooks/use-price-input';
import { track } from '@/lib/analytics/events';
import {
  completeOnboardingAction,
  createSecondTenantAction,
} from '@/server/actions/onboarding.actions';

const POST_ONBOARDING_PATH = '/menu?welcome=1';
const CHEF_IMAGE =
  'https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/T5aFVdCanUY/components/VbWmwtcwtWu.png';

type OnboardingPayload = {
  name: string;
  cuisine: string;
  itemName?: string;
  priceCents?: number;
};

const cuisines = [
  { id: 'mexicana', label: '🌮 Mexicana' },
  { id: 'pizza', label: '🍕 Pizza' },
  { id: 'burgers', label: '🍔 Burgers' },
  { id: 'cafe', label: '☕ Café' },
  { id: 'sushi', label: '🍣 Sushi' },
  { id: 'saludable', label: '🥗 Saludable' },
];

function splitCuisineLabel(label: string) {
  const [emoji, ...rest] = label.split(' ');
  return { emoji, name: rest.join(' ') };
}

export function OnboardingClient({ isAddingMenu }: { isAddingMenu: boolean }) {
  const router = useRouter();
  const [name, setName] = useReducer((_: string, next: string) => next, '');
  const [cuisine, setCuisine] = useReducer((_: string, next: string) => next, '');
  const [otherCuisine, setOtherCuisine] = useReducer((_: string, next: string) => next, '');
  const [itemName, setItemName] = useReducer((_: string, next: string) => next, '');
  const [priceCents, setPriceCents] = useReducer((_: number, next: number) => next, 0);
  const [isDishOpen, setIsDishOpen] = useReducer(
    (current: boolean, next: boolean | ((value: boolean) => boolean)) =>
      typeof next === 'function' ? next(current) : next,
    true,
  );
  const [loading, setLoading] = useReducer((_: boolean, next: boolean) => next, false);
  const [creatingSecondTenant, setCreatingSecondTenant] = useReducer((_: boolean, next: boolean) => next, false);
  const [existingTenant, setExistingTenant] = useReducer(
    (_: { tenantId: string; slug: string } | null, next: { tenantId: string; slug: string } | null) => next,
    null,
  );
  const lastPayloadRef = useRef<OnboardingPayload | null>(null);
  const { displayValue: priceDisplayValue, handleChange: handlePriceChange } = usePriceInput(
    0,
    setPriceCents,
  );
  const trimmedName = name.trim();
  const trimmedItemName = itemName.trim();
  const includeFirstItem = trimmedItemName.length > 0 && priceCents > 0;
  const progress = Math.round(
    ((trimmedName.length > 0 ? 1 : 0) + (cuisine.length > 0 ? 1 : 0) + (includeFirstItem ? 1 : 0)) / 3 * 100,
  );
  const trimmedOtherCuisine = otherCuisine.trim();
  const selectedCuisine = cuisine === 'otro' ? trimmedOtherCuisine : cuisine;
  const canSubmit = trimmedName.length > 0 && selectedCuisine.length > 0;

  function buildPayload(): OnboardingPayload {
    return {
      name: trimmedName,
      cuisine: selectedCuisine,
      ...(includeFirstItem
        ? {
            itemName: trimmedItemName,
            priceCents,
          }
        : {}),
    };
  }

  function completeNewTenant(tenantId: string) {
    track('onboarding_completed', { tenantId });
    toast.success('Tu menú ya vive online.');
    router.push(POST_ONBOARDING_PATH);
  }

  async function finish() {
    setLoading(true);
    try {
      const payload = buildPayload();
      lastPayloadRef.current = payload;

      if (isAddingMenu) {
        try {
          const res = await createSecondTenantAction(payload);
          completeNewTenant(res.tenantId);
        } catch (err) {
          if (err instanceof Error && err.message.includes('plan_limit_reached')) {
            toast.error('Tu plan no permite más menús. Cambia a Business para agregar varios.');
          } else {
            toast.error('No pude crear el menú. Reintenta.');
          }
        }
        return;
      }

      const res = await completeOnboardingAction(payload);

      if (res.existing) {
        setExistingTenant({ tenantId: res.tenantId, slug: res.slug });
        return;
      }

      completeNewTenant(res.tenantId);
    } catch {
      toast.error('No pude crear el menú. Reintenta.');
    } finally {
      setLoading(false);
    }
  }

  function skipFirstItem() {
    setItemName('');
    handlePriceChange('');
    setIsDishOpen(false);
  }

  async function createAnotherRestaurant() {
    const payload = lastPayloadRef.current ?? buildPayload();
    setCreatingSecondTenant(true);
    try {
      const res = await createSecondTenantAction(payload);
      setExistingTenant(null);
      completeNewTenant(res.tenantId);
    } catch {
      toast.error('No pude crear otro restaurante. Reintenta.');
    } finally {
      setCreatingSecondTenant(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--brand-surface)] pb-24 font-sans">
      <header className="sticky top-0 z-50 border-b border-[var(--brand-card-border)] bg-[var(--brand-surface)] px-6 py-4">
        <div className="mx-auto max-w-[600px] space-y-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Volver"
              className="text-ink-500 hover:text-ink-900"
            >
              <ChevronLeft className="size-6" />
            </Button>
            <span className="font-heading text-sm font-bold text-ink-500">Configura tu menú</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100" aria-label="Progreso de onboarding">
            <div
              className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progress, 66)}%` }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[600px] flex-1 space-y-12 px-6 pt-8">
        <section className="flex items-center gap-6">
          <Image
            src={CHEF_IMAGE}
            alt="Chef"
            width={128}
            height={128}
            priority
            className="size-24 shrink-0 object-contain ipad:h-32 ipad:w-32"
          />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-ink-900">
              Ya casi. <br />
              <span className="text-[var(--brand-primary)]">
                {isAddingMenu ? '¿Cómo se llama?' : '¿Qué cocina preparas?'}
              </span>
            </h1>
            <p className="text-sm text-ink-500">
              {isAddingMenu
                ? 'Crea otro menú independiente.'
                : 'Ayúdanos a personalizar tu menú digital.'}
            </p>
          </div>
        </section>

        <Card className="flex items-center justify-between rounded-2xl border-[1.5px] border-[var(--brand-card-border)] p-5 opacity-90 shadow-sm">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="shrink-0 rounded-full bg-menta-100 p-2 text-menta-600">
              <Check className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
                Nombre del restaurante
              </p>
              <Input
                autoFocus
                aria-label="Nombre del restaurante"
                placeholder="Taquería Los Compas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                containerClassName="mt-1 gap-0"
                controlClassName="h-auto border-0 bg-transparent p-0 focus-within:border-transparent focus-within:shadow-none"
                className="text-base font-bold placeholder:text-ink-500"
              />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 px-2 text-sm font-bold text-[var(--brand-primary)]"
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('input[aria-label="Nombre del restaurante"]');
              input?.focus();
            }}
          >
            Editar
          </Button>
        </Card>

        <section className="space-y-6">
          <div className="grid grid-cols-2 gap-3" aria-label="Tipo de cocina">
            {cuisines.map((c) => {
              const { emoji, name: cuisineName } = splitCuisineLabel(c.label);
              const selected = cuisine === c.id;
              return (
                <Button
                  key={c.id}
                  type="button"
                  variant={selected ? 'secondary' : 'outline'}
                  aria-pressed={selected}
                  onClick={() => setCuisine(c.id)}
                  className={`flex h-auto min-h-[92px] flex-col items-center gap-2 rounded-2xl border-[1.5px] p-4 transition-all ${
                    selected
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-on-primary)]'
                      : 'border-[var(--brand-card-border)] bg-[var(--brand-card)] hover:border-[var(--brand-primary-border)]'
                  }`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {emoji}
                  </span>
                  <span className="text-sm font-bold">{cuisineName}</span>
                </Button>
              );
            })}
          </div>

          <Input
            label="Otro tipo de cocina"
            placeholder="Ej: Fusión Japonesa"
            value={otherCuisine}
            onChange={(e) => {
              setOtherCuisine(e.target.value);
              setCuisine('otro');
            }}
            containerClassName="gap-2"
            labelClassName="px-1 text-xs font-bold uppercase tracking-widest text-ink-500"
            controlClassName="h-12 rounded-xl border-[1.5px] border-[var(--brand-card-border)] focus-within:ring-2 focus-within:ring-[var(--brand-primary-ring)] focus-within:shadow-none"
            className="font-normal"
          />
        </section>

        <section className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDishOpen((open) => !open)}
            aria-expanded={isDishOpen}
            className="h-auto w-full flex-col rounded-2xl border-dashed bg-ink-100/30 p-6 text-center hover:bg-ink-100/50"
          >
            <Utensils className="mx-auto size-8 text-ink-500" aria-hidden="true" />
            <p className="mt-2 font-bold text-ink-500">Paso 3: Tu primer platillo</p>
            <p className="mt-1 text-xs text-ink-500/70">
              Agregaremos un ítem para que veas cómo queda.
            </p>
          </Button>

          {isDishOpen && (
            <Card className="grid gap-4 rounded-2xl border-[1.5px] border-[var(--brand-card-border)] p-5 shadow-sm ipad:grid-cols-2">
              <Input
                label="Nombre"
                placeholder="Tacos al pastor"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                controlClassName="h-12 rounded-xl border-[1.5px] border-[var(--brand-card-border)]"
              />
              <Input
                label="Precio"
                type="text"
                inputMode="decimal"
                prefix="$"
                placeholder="0"
                value={priceDisplayValue}
                onChange={(e) => handlePriceChange(e.target.value)}
                controlClassName="h-12 rounded-xl border-[1.5px] border-[var(--brand-card-border)]"
              />
              <Button variant="outline" size="lg" className="w-full rounded-xl ipad:col-span-2" onClick={skipFirstItem}>
                Saltar y agregar después
              </Button>
            </Card>
          )}
        </section>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--brand-card-border)] bg-[var(--brand-surface-translucent)] p-6 backdrop-blur-md">
        <div className="mx-auto flex max-w-[600px] items-center justify-between gap-4">
          <Button variant="ghost" size="lg" onClick={skipFirstItem} className="px-4 font-bold text-ink-500 hover:text-ink-900">
            Saltar
          </Button>
          <Button size="xl" className="flex-1 rounded-2xl font-bold shadow-lg" disabled={!canSubmit} loading={loading} onClick={finish}>
            {isAddingMenu ? 'Crear nuevo menú' : 'Siguiente paso'}
            {!loading && <ArrowRight className="size-5" />}
          </Button>
        </div>
      </footer>

      {existingTenant && (
        <ExistingTenantDialog
          slug={existingTenant.slug}
          creatingSecondTenant={creatingSecondTenant}
          openDashboard={() => router.push('/dashboard')}
          createAnotherRestaurant={createAnotherRestaurant}
        />
      )}
    </main>
  );
}

function ExistingTenantDialog({
  slug,
  creatingSecondTenant,
  openDashboard,
  createAnotherRestaurant,
}: {
  slug: string;
  creatingSecondTenant: boolean;
  openDashboard: () => void;
  createAnotherRestaurant: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={() => undefined}
      title={`Ya tienes este restaurante: ${slug}`}
    >
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-ink-900">
          Ya tienes este restaurante: {slug}
        </h2>
        <p className="text-sm text-ink-500">
          Puedes ir al panel actual o crear otro restaurante con estos datos.
        </p>
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={openDashboard}>
            Ir al panel
          </Button>
          <Button
            variant="outline"
            size="lg"
            loading={creatingSecondTenant}
            onClick={createAnotherRestaurant}
          >
            Crear otro restaurante
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
