'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { track } from '@/lib/analytics/events';
import { completeOnboardingAction } from '@/server/actions/onboarding.actions';

const TOTAL_STEPS = 4;

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
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  function next() {
    track('onboarding_step', { step });
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function finish() {
    setLoading(true);
    try {
      const res = await completeOnboardingAction({
        name,
        cuisine,
        itemName,
        priceCents: Math.round(price * 100),
      });
      track('onboarding_completed', { tenantId: res.tenantId });
      toast.success('¡Tu menú ya vive online! 🎉');
      router.push('/dashboard');
    } catch {
      toast.error('No pude crear el platillo. Reintenta.');
    } finally {
      setLoading(false);
    }
  }

  const canNext =
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && cuisine.length > 0) ||
    (step === 3 && itemName.trim().length > 0 && price > 0) ||
    step === 4;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-6 pt-8">
      <div className="mb-6 flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-mostaza-500' : 'bg-ink-100'
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-6">
        {step === 1 && (
          <>
            <h2 className="text-3xl font-extrabold">¿Cómo se llama tu changarro?</h2>
            <p className="text-ink-500">Después puedes cambiarlo.</p>
            <Input
              autoFocus
              placeholder="Taquería Don Pepe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-extrabold">¿Qué tipo de comida sirves?</h2>
            <p className="text-ink-500">Pre-cargamos algunas categorías.</p>
            <div className="grid grid-cols-2 gap-3">
              {cuisines.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCuisine(c.id)}
                  className={`flex h-20 items-center justify-center rounded-md border-2 text-base font-semibold transition-all ${
                    cuisine === c.id
                      ? 'border-mostaza-500 bg-mostaza-50'
                      : 'border-ink-300 bg-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-3xl font-extrabold">Tu primer platillo</h2>
            <p className="text-ink-500">El que más venden.</p>
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
              prefix="$"
              placeholder="0"
              value={price || ''}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </>
        )}

        {step === 4 && (
          <>
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-extrabold">¡Listo, jefe!</h2>
            <p className="text-ink-500">
              Tu menú ya vive en internet. Compártelo donde sea — el QR es fijo aunque cambies precios.
            </p>
            <div className="rounded-md bg-crema-100 p-6 text-center">
              <code className="text-sm">fudimenu.app/m/{name.toLowerCase().replace(/\s+/g, '-') || 'tu-restaurante'}</code>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {step > 1 && (
          <Button variant="outline" size="lg" onClick={back}>
            Atrás
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button size="lg" className="flex-1" disabled={!canNext} onClick={next}>
            Siguiente →
          </Button>
        ) : (
          <Button size="lg" className="flex-1" loading={loading} onClick={finish}>
            Ver mi menú
          </Button>
        )}
      </div>
    </main>
  );
}
