import { Suspense, type ComponentProps } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { isMockRuntime } from '@/lib/mock/runtime';
import { requireAuth } from '@/server/guards/require-auth';
import { getLiveStripePrices } from '@/server/services/stripe-prices';
import { BillingPlans } from './billing-plans';

type BillingPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const [{ checkout }, ctx] = await Promise.all([searchParams, requireAuth()]);

  return (
    <>
      <AppHeader title="Plan y facturación" showBack />
      <main className="flex flex-col gap-4 px-4 pb-8 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        {checkout === 'success' && (
          <Card className="border border-menta-500/40 bg-menta-50 shadow-sm ipad:p-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-menta-700" />
              <div className="space-y-1">
                <h2 className="font-bold text-ink-900">Pago iniciado</h2>
                <p className="text-sm text-ink-700">
                  <strong>Tarjeta:</strong> suscripción activa de inmediato, se renueva
                  automáticamente cada ciclo.
                </p>
                <p className="text-sm text-ink-700">
                  <strong>OXXO/SPEI:</strong> pago manual - sigue las instrucciones que Stripe
                  generó. Tu plan se activa cuando confirmamos el pago (puede tomar hasta 1 día
                  hábil para SPEI).
                </p>
              </div>
            </div>
          </Card>
        )}

        {checkout === 'cancelled' && (
          <Card className="border border-coral-500/40 bg-coral-50 shadow-sm ipad:p-5">
            <div className="flex gap-3">
              <XCircle className="mt-0.5 size-5 shrink-0 text-coral-600" />
              <p className="text-sm text-ink-700">Pago cancelado. Puedes intentarlo de nuevo.</p>
            </div>
          </Card>
        )}

        <Suspense fallback={<BillingPlansLoading />}>
          <BillingContent tenantId={ctx.tenantId} currentPlan={ctx.plan} />
        </Suspense>
      </main>
    </>
  );
}

async function BillingContent({
  tenantId,
  currentPlan,
}: {
  tenantId: string;
  currentPlan: ComponentProps<typeof BillingPlans>['currentPlan'];
}) {
  const [tenant, livePrices] = await Promise.all([
    isMockRuntime()
      ? Promise.resolve({
          stripeCustomerId: mockTenant.stripeCustomerId,
          stripeSubscriptionId: mockTenant.stripeSubscriptionId,
        })
      : getPrisma().tenant.findUnique({
          where: { id: tenantId },
          select: { stripeCustomerId: true, stripeSubscriptionId: true },
        }),
    getLiveStripePrices().catch(() => ({ pro: {}, business: {} })),
  ]);

  return (
    <BillingPlans
      currentPlan={currentPlan}
      hasStripeCustomer={!!tenant?.stripeCustomerId}
      hasStripeSubscription={!!tenant?.stripeSubscriptionId}
      livePrices={livePrices}
    />
  );
}

function BillingPlansLoading() {
  return (
    <div className="grid gap-4 ipad-landscape:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="space-y-4 ipad:p-5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-11 w-full" />
        </Card>
      ))}
    </div>
  );
}
