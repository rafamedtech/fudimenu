import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  customersCreate: vi.fn(async () => ({ id: 'cus_referred' })),
  customersSearch: vi.fn(async () => ({ data: [{ id: 'cus_referrer', metadata: { userId: 'user-referrer' } }] })),
  customersList: vi.fn(async () => ({ data: [] })),
  createBalanceTransaction: vi.fn(async () => ({ id: 'cbtxn_referral_credit' })),
  subscriptionsCreate: vi.fn(async () => ({ id: 'sub_trial' })),
  referralFindFirst: vi.fn(),
  referralUpdateMany: vi.fn(async () => ({ count: 1 })),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: {
      create: mocks.customersCreate,
      search: mocks.customersSearch,
      list: mocks.customersList,
      createBalanceTransaction: mocks.createBalanceTransaction,
    },
    subscriptions: {
      create: mocks.subscriptionsCreate,
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    referral: {
      findFirst: mocks.referralFindFirst,
      updateMany: mocks.referralUpdateMany,
    },
  })),
}));

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalStripePricePro = process.env.STRIPE_PRICE_PRO;
const originalNextPublicStripePricePro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
const originalResendApiKey = process.env.RESEND_API_KEY;

describe('billingService', () => {
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.STRIPE_PRICE_PRO = originalStripePricePro;
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO = originalNextPublicStripePricePro;
    process.env.RESEND_API_KEY = originalResendApiKey;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('credits $149 MXN to the referrer when the referred tenant activates Stripe', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
    delete process.env.RESEND_API_KEY;
    mocks.referralFindFirst.mockResolvedValue({
      id: 'referral-1',
      code: 'tacos-pepe-x9k2',
      referrerId: 'user-referrer',
    });

    const { billingService } = await import('../../src/server/services/billing.service');

    const result = await billingService.startProTrialForTenant({
      tenantId: 'tenant-referred',
      tenantName: 'Tortas Norte',
      tenantSlug: 'tortas-norte',
      userId: 'user-referred',
      email: 'owner@tortas.test',
    });

    expect(result).toEqual(
      expect.objectContaining({
        stripeEnabled: true,
        referralCredit: {
          applied: true,
          referralId: 'referral-1',
          customerId: 'cus_referrer',
          amount: 14900,
          currency: 'mxn',
        },
      }),
    );
    expect(mocks.customersSearch).toHaveBeenCalledWith({
      query: "metadata['userId']:'user-referrer'",
      limit: 1,
    });
    expect(mocks.createBalanceTransaction).toHaveBeenCalledWith(
      'cus_referrer',
      {
        amount: -14900,
        currency: 'mxn',
        description: 'Credito por referido FudiMenu',
        metadata: {
          referralId: 'referral-1',
          referralCode: 'tacos-pepe-x9k2',
          referredTenantId: 'tenant-referred',
        },
      },
      { idempotencyKey: 'referral:referral-1:credit:14900mxn' },
    );
    expect(mocks.referralUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'referral-1',
        creditedAt: null,
      },
      data: {
        status: 'credited',
        creditedAt: expect.any(Date),
      },
    });
  });
});
