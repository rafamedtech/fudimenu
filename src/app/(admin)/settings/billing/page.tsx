import { CheckCircle2, Landmark, Store } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PLAN_CONFIG } from '@/config/plans';
import {
  createBillingCheckoutFormAction,
  createCustomerPortalAction,
} from '@/server/actions/billing.actions';
import { requireAuth } from '@/server/guards/require-auth';

type BillingPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

function formatMoney(priceCents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(priceCents / 100);
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const [{ checkout }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const plans = [PLAN_CONFIG.free, PLAN_CONFIG.pro, PLAN_CONFIG.business];

  return (
    <>
      <AppHeader title="Plan y facturación" showBack />
      <main className="flex flex-col gap-4 px-4">
        {checkout === 'success' && (
          <Card className="border border-menta-500/40 bg-menta-100 shadow-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-700" />
              <div className="space-y-2">
                <h2 className="font-bold text-ink-900">Pago iniciado</h2>
                <p className="text-sm leading-6 text-ink-700">
                  Tarjeta activa una suscripción recurrente. OXXO y SPEI son pago manual inicial:
                  tu plan se activa cuando Stripe confirma el pago.
                </p>
                <p className="text-sm leading-6 text-ink-700">
                  Si elegiste SPEI, usa la CLABE e instrucciones de transferencia que Stripe
                  generó para completar el pago desde tu banco.
                </p>
              </div>
            </div>
          </Card>
        )}

        <section className="space-y-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-ink-900">{plan.name}</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    {plan.priceCents === 0 ? 'Gratis' : `${formatMoney(plan.priceCents)} al mes`}
                  </p>
                  {ctx.plan === plan.id && (
                    <span className="mt-2 inline-flex rounded-full bg-menta-100 px-3 py-1 text-xs font-bold text-ink-800">
                      Plan actual
                    </span>
                  )}
                </div>
                {plan.id === 'free' ? (
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-700">
                    Free
                  </span>
                ) : plan.id === 'pro' ? (
                  <Store className="h-6 w-6 text-mostaza-600" />
                ) : (
                  <Landmark className="h-6 w-6 text-coral-500" />
                )}
              </div>

              <ul className="space-y-2 text-sm text-ink-700">
                <li>Tarjeta recurrente; OXXO/SPEI como pago manual inicial</li>
                <li>
                  {plan.limits.branches === null
                    ? 'Sucursales ilimitadas'
                    : `${plan.limits.branches} sucursales`}
                </li>
                <li>
                  {plan.limits.items === null ? 'Items ilimitados' : `${plan.limits.items} items`}
                </li>
              </ul>

              {plan.id === 'free' ? null : ctx.plan === plan.id ? (
                <form action={createCustomerPortalAction}>
                  <Button type="submit" className="w-full">
                    Manage
                  </Button>
                </form>
              ) : (
                <div className="space-y-2">
                  <form action={createBillingCheckoutFormAction}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="cycle" value="monthly" />
                    <input type="hidden" name="method" value="card" />
                    <Button type="submit" className="w-full">
                      Tarjeta mensual
                    </Button>
                  </form>
                  <form action={createBillingCheckoutFormAction}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="cycle" value="annual" />
                    <input type="hidden" name="method" value="card" />
                    <Button type="submit" variant="outline" className="w-full">
                      Tarjeta anual -25%
                    </Button>
                  </form>
                  <form action={createBillingCheckoutFormAction}>
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="cycle" value="monthly" />
                    <input type="hidden" name="method" value="cash" />
                    <Button type="submit" variant="secondary" className="w-full">
                      OXXO / SPEI
                    </Button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </section>
      </main>
    </>
  );
}
