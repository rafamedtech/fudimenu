import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  customersCreate: vi.fn(async () => ({ id: 'cus_123' })),
  checkoutSessionsCreate: vi.fn(async () => ({ url: 'https://checkout.stripe.test/session' })),
  billingPortalSessionsCreate: vi.fn(async () => ({ url: 'https://billing.stripe.test/portal' })),
  tenantFindUnique: vi.fn(async () => null as { stripeCustomerId: string | null } | null),
  tenantUpdate: vi.fn(async () => ({})),
  redirect: vi.fn((url: string) => { throw Object.assign(new Error('NEXT_REDIRECT'), { digest: `NEXT_REDIRECT;${url}` }); }),
  requireAuth: vi.fn(async () => ({
    userId: 'user-1',
    email: 'owner@example.com',
    tenantId: 'tenant-1',
    plan: 'pro',
    role: 'owner',
    memberships: [
      {
        tenantId: 'tenant-1',
        role: 'owner',
        tenant: { name: 'Taquería Norte', slug: 'taqueria-norte', plan: 'pro' },
      },
    ],
  })),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    checkout: { sessions: { create: mocks.checkoutSessionsCreate } },
    customers: { create: mocks.customersCreate },
    billingPortal: { sessions: { create: mocks.billingPortalSessionsCreate } },
  })),
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    tenant: {
      findUnique: mocks.tenantFindUnique,
      update: mocks.tenantUpdate,
    },
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

async function loadActions() {
  return import('../../src/server/actions/billing.actions');
}

describe('createBillingCheckoutAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.fudimenu.test');
  });

  it('creates card subscription session (monthly, new customer)', async () => {
    const { createBillingCheckoutAction } = await loadActions();
    const result = await createBillingCheckoutAction({ plan: 'pro' });

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.test/session' });
    expect(mocks.customersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'owner@example.com' }),
      { idempotencyKey: 'tenant:tenant-1:customer' },
    );
    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: 'cus_123',
        success_url: 'https://app.fudimenu.test/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.fudimenu.test/settings/billing?checkout=cancelled',
      }),
    );
  });

  it('reuses existing stripeCustomerId — no new customer created', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro' });

    expect(mocks.customersCreate).not.toHaveBeenCalled();
    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: 'cus_existing' }),
    );
  });

  it('uses Price ID for card subscription when env var is set', async () => {
    vi.stubEnv('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly_real');
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro', cycle: 'monthly', method: 'card' });

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: 'price_pro_monthly_real', quantity: 1 }],
      }),
    );
  });

  it('uses Price ID for annual card subscription', async () => {
    vi.stubEnv('STRIPE_PRICE_PRO_ANNUAL', 'price_pro_annual_real');
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro', cycle: 'annual', method: 'card' });

    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_pro_annual_real', quantity: 1 }],
      }),
    );
  });

  it('falls back to price_data when Price ID env var is not set', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro', cycle: 'monthly', method: 'card' });

    const call = (mocks.checkoutSessionsCreate.mock.calls as any)[0][0];
    expect(call.line_items[0]).toHaveProperty('price_data');
    expect(call.line_items[0]).not.toHaveProperty('price');
  });

  it('calculates 25% annual discount in price_data fallback', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro', cycle: 'annual', method: 'card' });

    const call = (mocks.checkoutSessionsCreate.mock.calls as any)[0][0];
    const unitAmount = call.line_items[0].price_data.unit_amount;
    // Pro: 14900 * 12 * 0.75 = 134100
    expect(unitAmount).toBe(Math.round(14900 * 12 * 0.75));
  });

  it('creates one-time OXXO/SPEI payment session', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    const result = await createBillingCheckoutAction({ plan: 'pro', method: 'cash' });

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.test/session' });
    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );
  });

  it('OXXO/SPEI always uses price_data (not Price ID)', async () => {
    vi.stubEnv('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly_real');
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'pro', method: 'cash' });

    const call = (mocks.checkoutSessionsCreate.mock.calls as any)[0][0];
    expect(call.line_items[0]).toHaveProperty('price_data');
  });

  it('embeds metadata in session and subscription_data for card', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createBillingCheckoutAction } = await loadActions();
    await createBillingCheckoutAction({ plan: 'business', cycle: 'annual', method: 'card' });

    const expected = expect.objectContaining({
      tenantId: 'tenant-1',
      userId: 'user-1',
      plan: 'business',
      cycle: 'annual',
      method: 'card',
    });
    const call = (mocks.checkoutSessionsCreate.mock.calls as any)[0][0];
    expect(call.metadata).toEqual(expected);
    expect(call.subscription_data.metadata).toEqual(expected);
  });
});

describe('createCustomerPortalAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.fudimenu.test');
  });

  it('redirects to billing portal when customer exists', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: 'cus_existing' });

    const { createCustomerPortalAction } = await loadActions();
    await expect(createCustomerPortalAction()).rejects.toThrow('NEXT_REDIRECT');

    expect(mocks.billingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: 'cus_existing',
      return_url: 'https://app.fudimenu.test/settings/billing',
    });
  });

  it('throws when tenant has no stripeCustomerId', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ stripeCustomerId: null });

    const { createCustomerPortalAction } = await loadActions();
    await expect(createCustomerPortalAction()).rejects.toThrow('missing_stripe_customer');
  });
});
