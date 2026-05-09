import { CheckCircle2, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card } from '@/components/ui/card';
import { getPrisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/guards/require-auth';
import { BillingPlans } from './billing-plans';

type BillingPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const [{ checkout }, ctx] = await Promise.all([searchParams, requireAuth()]);

  const tenant = await getPrisma().tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  return (
    <>
      <AppHeader title="Plan y facturación" showBack />
      <main className="flex flex-col gap-4 px-4 pb-8">
        {checkout === 'success' && (
          <Card className="border border-menta-500/40 bg-menta-50 shadow-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-menta-700" />
              <div className="space-y-1">
                <h2 className="font-bold text-ink-900">Pago iniciado</h2>
                <p className="text-sm text-ink-700">
                  <strong>Tarjeta:</strong> suscripción activa de inmediato, se renueva
                  automáticamente cada ciclo.
                </p>
                <p className="text-sm text-ink-700">
                  <strong>OXXO/SPEI:</strong> pago manual — sigue las instrucciones que Stripe
                  generó. Tu plan se activa cuando confirmamos el pago (puede tomar hasta 1 día
                  hábil para SPEI).
                </p>
              </div>
            </div>
          </Card>
        )}

        {checkout === 'cancelled' && (
          <Card className="border border-coral-500/40 bg-coral-50 shadow-sm">
            <div className="flex gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral-600" />
              <p className="text-sm text-ink-700">Pago cancelado. Puedes intentarlo de nuevo.</p>
            </div>
          </Card>
        )}

        <BillingPlans
          currentPlan={ctx.plan}
          hasStripeCustomer={!!tenant?.stripeCustomerId}
          hasStripeSubscription={!!tenant?.stripeSubscriptionId}
        />
      </main>
    </>
  );
}
