'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-6 pt-8">
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-ink-100" aria-label="Progreso de onboarding">
        <div
          className="h-full rounded-full bg-mostaza-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-5">
        <section className="flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold">¿Cómo se llama tu changarro?</h2>
          <p className="text-ink-500">Dinos lo básico y FudiMenu arranca con platillos listos para editar.</p>
          <Input
            autoFocus
            label="Nombre del restaurante"
            placeholder="Taquería Don Pepe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-xl font-extrabold">¿Qué tipo de comida?</h3>
          <div className="grid grid-cols-2 gap-3" aria-label="Tipo de cocina">
            {cuisines.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cuisine === c.id}
                onClick={() => setCuisine(c.id)}
                className={`flex h-16 items-center justify-center rounded-md border-2 text-base font-semibold transition-all ${
                  cuisine === c.id
                    ? 'border-mostaza-500 bg-mostaza-50'
                    : 'border-ink-300 bg-[var(--brand-card)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-ink-200 bg-[var(--brand-card)]">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
            aria-expanded={isDishOpen}
            onClick={() => setIsDishOpen((open) => !open)}
          >
            <span>
              <span className="block text-xl font-extrabold">Tu primer platillo</span>
              <span className="text-sm text-ink-500">Opcional, sin foto obligatoria.</span>
            </span>
            <span className="text-2xl font-bold text-mostaza-600" aria-hidden>
              {isDishOpen ? '−' : '+'}
            </span>
          </button>

          {isDishOpen && (
            <div className="flex flex-col gap-4 border-t border-ink-100 px-4 py-4">
              <Input
                autoFocus
                label="Nombre"
                placeholder="Tacos al pastor"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <Input
                label="Precio"
                type="text"
                inputMode="decimal"
                prefix="$"
                placeholder="0"
                value={priceDisplayValue}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
              <Button variant="outline" size="lg" className="w-full" onClick={skipFirstItem}>
                Saltar y agregar después
              </Button>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6">
        <Button size="lg" className="w-full" disabled={!canSubmit} loading={loading} onClick={finish}>
          Crear mi menú
        </Button>
      </div>

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
