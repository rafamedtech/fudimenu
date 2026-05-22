import 'server-only';
import Stripe from 'stripe';
import { unstable_cache } from 'next/cache';
import { env } from '@/lib/env';
import type { LivePrices } from '@/types/billing';

export type PlanPriceId = 'pro' | 'business';
export type Cycle = 'monthly' | 'annual';

export type { LivePrices } from '@/types/billing';

function priceIdFor(plan: PlanPriceId, cycle: Cycle): string | undefined {
  if (plan === 'pro' && cycle === 'monthly') return env.STRIPE_PRICE_PRO_MONTHLY;
  if (plan === 'pro' && cycle === 'annual') return env.STRIPE_PRICE_PRO_ANNUAL;
  if (plan === 'business' && cycle === 'monthly') return env.STRIPE_PRICE_BUSINESS_MONTHLY;
  if (plan === 'business' && cycle === 'annual') return env.STRIPE_PRICE_BUSINESS_ANNUAL;
  return undefined;
}

async function fetchLivePricesUncached(): Promise<LivePrices> {
  const empty: LivePrices = { pro: {}, business: {} };
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return empty;

  const stripe = new Stripe(secret, { apiVersion: '2025-02-24.acacia' });

  const combos: Array<{ plan: PlanPriceId; cycle: Cycle; id: string }> = [];
  for (const plan of ['pro', 'business'] as PlanPriceId[]) {
    for (const cycle of ['monthly', 'annual'] as Cycle[]) {
      const id = priceIdFor(plan, cycle);
      if (id) combos.push({ plan, cycle, id });
    }
  }

  const results = await Promise.allSettled(combos.map((c) => stripe.prices.retrieve(c.id)));

  const out: LivePrices = { pro: {}, business: {} };
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    const price = r.value;
    if (price.unit_amount == null) return;
    const { plan, cycle } = combos[i];
    out[plan][cycle] = { unitAmount: price.unit_amount, currency: price.currency.toUpperCase() };
  });
  return out;
}

export const getLiveStripePrices = unstable_cache(fetchLivePricesUncached, ['stripe-prices-v1'], {
  revalidate: 300,
  tags: ['stripe-prices'],
});
