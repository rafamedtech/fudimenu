'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { z } from 'zod';
import { PLAN_CONFIG } from '@/config/plans';
import { getPrisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/guards/require-auth';
import type { Plan } from '@/types/domain';

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'business']),
  cycle: z.enum(['monthly', 'annual']).default('monthly'),
  method: z.enum(['card', 'cash']).default('card'),
});

let stripeClient: Stripe | null = null;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('missing_stripe_secret_key');

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function createBillingCheckoutAction(input: unknown) {
  const { plan, cycle, method } = checkoutSchema.parse(input);
  const ctx = await requireAuth();
  const planConfig = PLAN_CONFIG[plan as Plan];
  const appUrl = getAppUrl();
  const metadata = {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    plan,
    cycle,
    method,
  };

  if (
    process.env.E2E_TEST_AUTH === 'true' &&
    process.env.E2E_STRIPE_CHECKOUT_MOCK === 'true' &&
    process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
  ) {
    await getPrisma().tenant.update({
      where: { id: ctx.tenantId },
      data: { plan },
    });

    return {
      ok: true as const,
      url: `${appUrl}/settings/billing?checkout=success&session_id=cs_test_e2e_mock`,
    };
  }

  const stripe = getStripe();
  let tenant: { stripeCustomerId: string | null } | null = null;
  let canPersistCustomer = true;
  try {
    tenant = await getPrisma().tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { stripeCustomerId: true },
    });
  } catch {
    canPersistCustomer = false;
  }

  const customerId = tenant?.stripeCustomerId ?? (await stripe.customers.create({
    email: ctx.email,
    metadata,
  })).id;

  if (!tenant?.stripeCustomerId && canPersistCustomer) {
    await getPrisma().tenant.update({
      where: { id: ctx.tenantId },
      data: { stripeCustomerId: customerId },
    });
  }

  const unitAmount = cycle === 'annual'
    ? Math.round(planConfig.priceCents * 12 * 0.75)
    : planConfig.priceCents;
  const successUrl = `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${appUrl}/settings/billing?checkout=cancelled`;

  const sessionParams: Stripe.Checkout.SessionCreateParams =
    method === 'card'
      ? {
          mode: 'subscription',
          payment_method_types: ['card'],
          customer: customerId,
          line_items: [
            {
              price_data: {
                currency: 'mxn',
                unit_amount: unitAmount,
                recurring: { interval: cycle === 'annual' ? 'year' : 'month' },
                product_data: { name: `FudiMenu ${planConfig.name}` },
              },
              quantity: 1,
            },
          ],
          metadata,
          subscription_data: { metadata },
          success_url: successUrl,
          cancel_url: cancelUrl,
        }
      : {
          mode: 'payment',
          payment_method_types: ['oxxo', 'customer_balance'],
          payment_method_options: {
            customer_balance: {
              funding_type: 'bank_transfer',
              bank_transfer: {
                type: 'mx_bank_transfer',
                requested_address_types: ['spei'],
              },
            },
          },
          customer: customerId,
          line_items: [
            {
              price_data: {
                currency: 'mxn',
                unit_amount: unitAmount,
                product_data: { name: `FudiMenu ${planConfig.name} ${cycle === 'annual' ? 'anual' : 'mensual'}` },
              },
              quantity: 1,
            },
          ],
          metadata,
          payment_intent_data: { metadata },
          success_url: successUrl,
          cancel_url: cancelUrl,
        };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return { ok: true as const, url: session.url };
}

export async function createBillingCheckoutFormAction(formData: FormData) {
  const result = await createBillingCheckoutAction({
    plan: formData.get('plan'),
    cycle: formData.get('cycle') || 'monthly',
    method: formData.get('method') || 'card',
  });

  if (!result.url) throw new Error('missing_checkout_url');

  redirect(result.url);
}

export async function createCustomerPortalAction() {
  const ctx = await requireAuth();
  const tenant = await getPrisma().tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant?.stripeCustomerId) {
    throw new Error('missing_stripe_customer');
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${getAppUrl()}/settings/billing`,
  });

  redirect(session.url);
}
