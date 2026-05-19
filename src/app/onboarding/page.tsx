'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { Doodle } from '@/components/brand/doodles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePriceInput } from '@/hooks/use-price-input';
import { track } from '@/lib/analytics/events';
import {
  completeOnboardingAction,
  createSecondTenantAction,
} from '@/server/actions/onboarding.actions';

const POST_ONBOARDING_PATH = '/menu?welcome=1';

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

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAddingMenu = searchParams.get('new') === '1';
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [priceCents, setPriceCents] = useState<number>(0);
  const [isDishOpen, setIsDishOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [creatingSecondTenant, setCreatingSecondTenant] = useState(false);
  const [existingTenant, setExistingTenant] = useState<{ tenantId: string; slug: string } | null>(null);
  const [lastPayload, setLastPayload] = useState<OnboardingPayload | null>(null);
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
  const canSubmit = trimmedName.length > 0 && cuisine.length > 0;

  function buildPayload(): OnboardingPayload {
    return {
      name: trimmedName,
      cuisine,
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
      setLastPayload(payload);

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
    const payload = lastPayload ?? buildPayload();
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
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-[var(--brand-surface)] px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-safe ipad:max-w-[820px] ipad:px-8 ipad:pb-32 ipad-landscape:max-w-[984px]">
      <header className="flex h-20 items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex h-12 w-12 items-center justify-center rounded-md text-ink-700 hover:bg-[var(--brand-primary-faint)]"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <p className="text-xl font-black">Paso 2 de 3</p>
      </header>
      <div className="mb-8 h-2 overflow-hidden rounded-full bg-ink-100" aria-label="Progreso de onboarding">
        <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid flex-1 gap-6 ipad-landscape:grid-cols-[0.8fr_1.2fr] ipad-landscape:items-start">
        <section className="flex items-center gap-5 ipad:gap-8 ipad-landscape:sticky ipad-landscape:top-8 ipad-landscape:flex-col ipad-landscape:items-start">
          <Doodle name="chef" className="h-32 w-36 shrink-0 ipad:h-44 ipad:w-52" />
          <div>
            <p className="text-sm font-black uppercase text-[var(--brand-accent-text)]">¡Casi listo!</p>
            <h1 className="fudi-h1 mt-1">
              {isAddingMenu ? 'Nuevo menú: ¿cómo se llama?' : '¿Qué cocina preparas?'}
            </h1>
            <p className="mt-3 text-lg leading-7 text-ink-500">
            {isAddingMenu
              ? 'Crea otro menú independiente con su propio link público.'
              : 'Ayúdanos a personalizar tu menú digital.'}
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md ipad:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-menta-100 text-menta-600">
                <Check className="h-7 w-7" />
              </span>
              <Input
                autoFocus
                label="Nombre del restaurante"
                placeholder="Taquería Los Compas"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-black">Tipo de cocina</h2>
            <div className="grid grid-cols-2 gap-3 ipad:gap-4" aria-label="Tipo de cocina">
              {cuisines.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={cuisine === c.id}
                  onClick={() => setCuisine(c.id)}
                  className={`flex min-h-24 flex-col items-center justify-center rounded-lg border-[1.5px] px-3 text-center text-lg font-black transition-all ipad:min-h-32 ipad:text-xl ${
                    cuisine === c.id
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] shadow-md'
                      : 'border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-sm hover:border-[var(--brand-primary-border)]'
                  }`}
                >
                  <span className="mb-2 text-3xl" aria-hidden>{c.label.split(' ')[0]}</span>
                  {c.label.replace(/^.+\s/, '')}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-md">
            <button
              type="button"
              className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left"
              aria-expanded={isDishOpen}
              onClick={() => setIsDishOpen((open) => !open)}
            >
              <span>
                <span className="block text-xl font-black">Primer platillo</span>
                <span className="text-sm text-ink-500">Opcional, lo puedes saltar.</span>
              </span>
              <span className="text-3xl font-black text-[var(--brand-accent-text)]" aria-hidden>
                {isDishOpen ? '-' : '+'}
              </span>
            </button>

            {isDishOpen && (
              <div className="grid gap-4 border-t border-ink-100 px-5 py-5 ipad:grid-cols-2">
                <Input label="Nombre" placeholder="Tacos al pastor" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                <Input label="Precio" type="text" inputMode="decimal" prefix="$" placeholder="0" value={priceDisplayValue} onChange={(e) => handlePriceChange(e.target.value)} />
                <Button variant="outline" size="lg" className="w-full ipad:col-span-2" onClick={skipFirstItem}>
                  Saltar y agregar después
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] border-t border-[var(--brand-card-border)] bg-[var(--brand-surface-translucent)] px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur ipad:max-w-[820px] ipad:px-8 ipad-landscape:max-w-[984px]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="lg" onClick={skipFirstItem} className="px-4 font-black">Saltar</Button>
          <Button size="xl" className="flex-1 font-black" disabled={!canSubmit} loading={loading} onClick={finish}>
            {isAddingMenu ? 'Crear nuevo menú' : 'Crear mi menú'}
            {!loading && <ArrowRight className="h-6 w-6" />}
          </Button>
        </div>
      </footer>

      {existingTenant && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink-900/40 px-4 py-6 sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="existing-tenant-title"
        >
          <div className="w-full max-w-sm rounded-md bg-[var(--brand-card)] p-6 shadow-xl">
            <h2 id="existing-tenant-title" className="text-2xl font-extrabold text-ink-900">
              Ya tienes este restaurante: {existingTenant.slug}
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Puedes ir al panel actual o crear otro restaurante con estos datos.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button size="lg" onClick={() => router.push('/dashboard')}>
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
        </div>
      )}
    </main>
  );
}
