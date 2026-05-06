'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { track } from '@/lib/analytics/events';
import { completeOnboardingAction } from '@/server/actions/onboarding.actions';

const POST_ONBOARDING_PATH = '/menu?welcome=1';

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
  const [price, setPrice] = useState<number>(0);
  const [isDishOpen, setIsDishOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const trimmedName = name.trim();
  const trimmedItemName = itemName.trim();
  const includeFirstItem = trimmedItemName.length > 0 && price > 0;
  const progress = Math.round(
    ((trimmedName.length > 0 ? 1 : 0) + (cuisine.length > 0 ? 1 : 0) + (includeFirstItem ? 1 : 0)) / 3 * 100,
  );
  const canSubmit = trimmedName.length > 0 && cuisine.length > 0;

  async function finish() {
    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        cuisine,
        ...(includeFirstItem
          ? {
              itemName: trimmedItemName,
              priceCents: Math.round(price * 100),
            }
          : {}),
      };
      const res = await completeOnboardingAction(payload);
      track('onboarding_completed', { tenantId: res.tenantId });
      toast.success('Tu menú ya vive online.');
      router.push(POST_ONBOARDING_PATH);
    } catch {
      toast.error('No pude crear el menú. Reintenta.');
    } finally {
      setLoading(false);
    }
  }

  function skipFirstItem() {
    setItemName('');
    setPrice(0);
    setIsDishOpen(false);
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
                    : 'border-ink-300 bg-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-ink-200 bg-white">
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
              type="number"
              min="0"
              inputMode="decimal"
              prefix="$"
              placeholder="0"
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
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
    </main>
  );
}
