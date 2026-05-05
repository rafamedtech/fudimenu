import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  webhookEventCreate: vi.fn(async () => ({})),
  tenantUpdate: vi.fn(async () => ({})),
  tenantFindUnique: vi.fn(async () => ({ name: 'Taqueria Norte' })),
  auditLogCreate: vi.fn(async () => ({})),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: mocks.constructEvent,
    },
  })),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    webhookEvent: {
      create: mocks.webhookEventCreate,
    },
    tenant: {
      update: mocks.tenantUpdate,
      findUnique: mocks.tenantFindUnique,
    },
    auditLog: {
      create: mocks.auditLogCreate,
    },
  })),
}));

vi.mock('@/server/services/billing.service', () => ({
  billingService: {
    sendPaymentFailedEmail: vi.fn(async () => ({ sent: true, reason: null })),
  },
}));

const originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;
const originalStripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function stripeRequest() {
  return new Request('https://app.fudimenu.test/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': 'sig_test',
    },
    body: '{"ok":true}',
  });
}

function eventFor(type: string, object: Record<string, unknown>) {
  return {
    id: `evt_${type.replaceAll('.', '_')}`,
    type,
    data: { object },
  };
}

describe('Stripe webhook route', () => {
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
    process.env.STRIPE_WEBHOOK_SECRET = originalStripeWebhookSecret;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns 400 when signature is invalid', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });

    const { POST } = await import('../../src/app/api/webhooks/stripe/route');
    const response = await POST(stripeRequest());

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('invalid_signature');
    expect(mocks.webhookEventCreate).not.toHaveBeenCalled();
  });

  it('returns 200 for an already processed event without re-processing', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    mocks.webhookEventCreate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));

    const { POST } = await import('../../src/app/api/webhooks/stripe/route');
    const first = await POST(stripeRequest());
    const second = await POST(stripeRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(1);
  });

  it("updates tenant plan for paid checkout.session.completed", async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        metadata: { tenantId: 'tenant-1', plan: 'business' },
      }),
    );

    const { POST } = await import('../../src/app/api/webhooks/stripe/route');
    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'business' },
    });
  });

  it("downgrades tenant to free for customer.subscription.deleted", async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.deleted', {
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );

    const { POST } = await import('../../src/app/api/webhooks/stripe/route');
    const response = await POST(stripeRequest());

    expect(response.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'free' },
    });
  });
});
