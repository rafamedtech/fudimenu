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
  const { plan } = checkoutSchema.parse(input);
  const ctx = await requireAuth();
  const planConfig = PLAN_CONFIG[plan as Plan];
  const appUrl = getAppUrl();
  const metadata = {
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    plan,
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

  const customer = await stripe.customers.create({
    email: ctx.email,
    metadata,
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card', 'oxxo'],
    customer: customer.id,
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          unit_amount: planConfig.priceCents,
          product_data: {
            name: `FudiMenu ${planConfig.name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata,
    payment_intent_data: {
      metadata,
    },
    success_url: `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/settings/billing?checkout=cancelled`,
  });

  return { ok: true as const, url: session.url };
}

export async function createBillingCheckoutFormAction(formData: FormData) {
  const result = await createBillingCheckoutAction({
    plan: formData.get('plan'),
  });

  if (!result.url) throw new Error('missing_checkout_url');

  redirect(result.url);
}
