import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  customersCreate: vi.fn(async () => ({ id: 'cus_123' })),
  checkoutSessionsCreate: vi.fn(async () => ({ url: 'https://checkout.stripe.test/session' })),
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
    checkout: {
      sessions: {
        create: mocks.checkoutSessionsCreate,
      },
    },
    customers: {
      create: mocks.customersCreate,
    },
  })),
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

describe('billing actions', () => {
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('creates a card subscription Checkout Session by default', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.fudimenu.test';

    const { createBillingCheckoutAction } = await import(
      '../../src/server/actions/billing.actions'
    );
    const result = await createBillingCheckoutAction({ plan: 'pro' });

    expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.test/session' });
    expect(mocks.customersCreate).toHaveBeenCalledWith({
      email: 'owner@example.com',
      metadata: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        plan: 'pro',
        cycle: 'monthly',
        method: 'card',
      },
    });
    expect(mocks.checkoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer: 'cus_123',
        subscription_data: {
          metadata: {
            tenantId: 'tenant-1',
            userId: 'user-1',
            plan: 'pro',
            cycle: 'monthly',
            method: 'card',
          },
        },
        success_url:
          'https://app.fudimenu.test/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://app.fudimenu.test/settings/billing?checkout=cancelled',
        metadata: {
          tenantId: 'tenant-1',
          userId: 'user-1',
          plan: 'pro',
          cycle: 'monthly',
          method: 'card',
        },
      }),
    );
  });

  it('creates a one-time OXXO/SPEI Checkout Session for manual cash payment', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.fudimenu.test';

    const { createBillingCheckoutAction } = await import(
      '../../src/server/actions/billing.actions'
    );
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
});
