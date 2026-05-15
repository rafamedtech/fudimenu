'use client';

import { Store } from 'lucide-react';
import { useState } from 'react';
import { PLANS } from '@/config/plans';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  createBillingCheckoutFormAction,
  createCustomerPortalAction,
} from '@/server/actions/billing.actions';
import type { Plan } from '@/types/domain';
import { track } from '@/lib/analytics/events';

type Cycle = 'monthly' | 'annual';

function formatMXN(cents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function annualTotal(monthlyCents: number) {
  return Math.round(monthlyCents * 12 * 0.75);
}

function annualPerMonth(monthlyCents: number) {
  return Math.round(annualTotal(monthlyCents) / 12);
}

function annualSavings(monthlyCents: number) {
  return monthlyCents * 12 - annualTotal(monthlyCents);
}

interface Props {
  currentPlan: Plan;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
}

export function BillingPlans({ currentPlan, hasStripeCustomer, hasStripeSubscription }: Props) {
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const plans = PLANS;

  return (
    <div className="flex flex-col gap-4">
      {/* Cycle toggle */}
      <div className="flex rounded-lg border border-ink-200 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => setCycle('monthly')}
          className={[
            'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
            cycle === 'monthly'
              ? 'bg-[var(--brand-card)] text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700',
          ].join(' ')}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => setCycle('annual')}
          className={[
            'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
            cycle === 'annual'
              ? 'bg-[var(--brand-card)] text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-700',
          ].join(' ')}
        >
          Anual{' '}
          <span className="ml-1 rounded-full bg-menta-100 px-2 py-0.5 text-xs font-bold text-ink-800">
            -25%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isPaid = plan.priceCents > 0;
        const planCycle = cycle as Cycle;

        const monthlyPrice = plan.priceCents;
        const displayPrice =
          !isPaid
            ? 'Gratis'
            : planCycle === 'annual'
              ? `${formatMXN(annualPerMonth(monthlyPrice))}/mes · ${formatMXN(annualTotal(monthlyPrice))}/año`
              : `${formatMXN(monthlyPrice)}/mes`;

        const savings =
          isPaid && planCycle === 'annual'
            ? `Ahorras ${formatMXN(annualSavings(monthlyPrice))} al año`
            : null;

        return (
          <Card key={plan.id} className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-ink-900">{plan.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-menta-100 px-2.5 py-0.5 text-xs font-bold text-ink-800">
                      Plan actual
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-ink-700">{displayPrice}</p>
                {savings && <p className="mt-0.5 text-xs text-menta-700">{savings}</p>}
              </div>
              {plan.id === 'free' ? null : (
                <Store className="h-5 w-5 shrink-0 text-mostaza-600" />
              )}
            </div>

            {/* Features */}
            <ul className="space-y-1.5 text-sm text-ink-600">
              {plan.id === 'free' && (
                <>
                  <li>· {plan.limits.items} platillos máximo</li>
                  <li>· {plan.limits.sections} secciones</li>
                  <li>· Marca FudiMenu visible</li>
                  <li>· Sin especiales del día</li>
                </>
              )}
              {plan.id === 'pro' && (
                <>
                  <li>· Platillos y secciones ilimitados</li>
                  <li>· Sin marca FudiMenu</li>
                  <li>· Especiales del día</li>
                  <li>· Analytics básico</li>
                </>
              )}
            </ul>

            {/* Actions */}
            {plan.id === 'free' ? null : isCurrent && hasStripeCustomer && hasStripeSubscription ? (
              <form action={createCustomerPortalAction}>
                <Button type="submit" variant="outline" className="w-full">
                  Administrar suscripción
                </Button>
              </form>
            ) : !isCurrent ? (
              <div className="space-y-2">
                {/* Card — recurring */}
                <form action={createBillingCheckoutFormAction}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <input type="hidden" name="cycle" value={planCycle} />
                  <input type="hidden" name="method" value="card" />
                  <Button
                    type="submit"
                    className="w-full"
                    onClick={() => track('plan_upgrade_started', { from: currentPlan, to: plan.id, method: 'card', cycle: planCycle })}
                  >
                    Tarjeta — suscripción recurrente
                  </Button>
                </form>
                {/* OXXO/SPEI — one-time manual */}
                <form action={createBillingCheckoutFormAction}>
                  <input type="hidden" name="plan" value={plan.id} />
                  <input type="hidden" name="cycle" value={planCycle} />
                  <input type="hidden" name="method" value="cash" />
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    onClick={() => track('plan_upgrade_started', { from: currentPlan, to: plan.id, method: 'cash', cycle: planCycle })}
                  >
                    OXXO / SPEI — pago único manual
                  </Button>
                </form>
                <p className="text-center text-xs text-ink-500">
                  Tarjeta: se renueva automáticamente. OXXO/SPEI: pago manual sin renovación
                  automática — recibirás instrucciones de Stripe.
                </p>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
