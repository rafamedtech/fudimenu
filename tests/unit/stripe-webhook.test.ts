import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  webhookEventCreate: vi.fn(async () => ({})),
  tenantUpdate: vi.fn(async () => ({ slug: 'taqueria-norte' })),
  tenantFindUnique: vi.fn(async () => ({ name: 'Taqueria Norte' } as { name: string | null } | null)),
  auditLogCreate: vi.fn(async () => ({})),
  sendPaymentFailedEmail: vi.fn(async () => ({ sent: true, reason: null })),
  posthogCapture: vi.fn(),
}));

vi.mock('@/lib/posthog-server', () => ({
  getPostHogClient: () => ({ capture: mocks.posthogCapture }),
}));

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: { constructEvent: mocks.constructEvent },
  })),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    webhookEvent: { create: mocks.webhookEventCreate },
    tenant: { update: mocks.tenantUpdate, findUnique: mocks.tenantFindUnique },
    auditLog: { create: mocks.auditLogCreate },
  })),
}));

vi.mock('@/server/services/billing.service', () => ({
  billingService: { sendPaymentFailedEmail: mocks.sendPaymentFailedEmail },
}));

function stripeRequest() {
  return new Request('https://app.fudimenu.test/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body: '{"ok":true}',
  });
}

function eventFor(type: string, object: Record<string, unknown>, id?: string) {
  return {
    id: id ?? `evt_${type.replaceAll('.', '_')}`,
    type,
    data: { object },
  };
}

describe('Stripe webhook route', () => {
  beforeEach(() => {
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_123');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_test');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  async function loadPOST() {
    const { POST } = await import('../../src/app/api/webhooks/stripe/route');
    return POST;
  }

  // ── Signature ──────────────────────────────────────────────────────────

  it('returns 400 when signature is invalid', async () => {
    mocks.constructEvent.mockImplementation(() => { throw new Error('bad signature'); });
    const POST = await loadPOST();
    const res = await POST(stripeRequest());
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('invalid_signature');
    expect(mocks.webhookEventCreate).not.toHaveBeenCalled();
  });

  // ── Idempotency ─────────────────────────────────────────────────────────

  it('skips processing for duplicate events (P2002)', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    mocks.webhookEventCreate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('Unique constraint'), { code: 'P2002' }));

    const POST = await loadPOST();
    const first = await POST(stripeRequest());
    const second = await POST(stripeRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(1);
  });

  // ── checkout.session.completed ──────────────────────────────────────────

  it('upgrades plan on payment mode checkout (OXXO/SPEI paid)', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'paid',
        metadata: { tenantId: 'tenant-1', plan: 'business' },
        customer: 'cus_abc',
      }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        plan: 'business',
        stripeCustomerId: 'cus_abc',
        stripeSubscriptionId: null,
      },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.upgraded' }) }),
    );
  });

  it('skips plan update for payment mode checkout when not paid', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'payment',
        payment_status: 'unpaid',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());
    expect(mocks.tenantUpdate).not.toHaveBeenCalled();
  });

  it('upgrades plan on subscription mode checkout (card)', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'subscription',
        payment_status: 'paid',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
        customer: 'cus_card',
        subscription: 'sub_card',
      }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'pro', stripeCustomerId: 'cus_card', stripeSubscriptionId: 'sub_card' },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.upgraded' }) }),
    );
  });

  // ── payment_intent.succeeded (OXXO/SPEI) ────────────────────────────────

  it('upgrades plan on payment_intent.succeeded (OXXO)', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('payment_intent.succeeded', {
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'pro', stripeSubscriptionId: null },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.upgraded' }) }),
    );
  });

  it('upgrades plan on charge.succeeded (SPEI)', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('charge.succeeded', {
        metadata: { tenantId: 'tenant-1', plan: 'business' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'business', stripeSubscriptionId: null },
      select: { slug: true },
    });
  });

  it('does not upgrade for charge.succeeded with unknown plan in metadata', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('charge.succeeded', {
        metadata: { tenantId: 'tenant-1', plan: 'enterprise' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());
    expect(mocks.tenantUpdate).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ───────────────────────────────────────

  it('upgrades plan when subscription becomes active', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.updated', {
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: false,
        customer: 'cus_1',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: {
        plan: 'pro',
        stripeCustomerId: 'cus_1',
        stripeSubscriptionId: 'sub_1',
      },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.upgraded' }) }),
    );
  });

  it('keeps plan active when trialing', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.updated', {
        id: 'sub_trial',
        status: 'trialing',
        cancel_at_period_end: false,
        customer: 'cus_1',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: 'pro' }) }),
    );
  });

  it('downgrades to free when subscription status is canceled', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.updated', {
        id: 'sub_1',
        status: 'canceled',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) - 3600,
        customer: 'cus_1',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'free', stripeSubscriptionId: null },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.downgraded' }) }),
    );
  });

  it('downgrades when cancel_at_period_end=true and period has ended', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.updated', {
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: Math.floor(Date.now() / 1000) - 1,
        customer: 'cus_1',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'free', stripeSubscriptionId: null },
      select: { slug: true },
    });
  });

  it('does NOT downgrade when cancel_at_period_end=true but period not yet ended', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.updated', {
        id: 'sub_1',
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        customer: 'cus_1',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    // Should upgrade (active + not yet ended) not downgrade
    expect(mocks.tenantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ plan: 'pro' }) }),
    );
  });

  // ── customer.subscription.deleted ──────────────────────────────────────

  it('downgrades to free on subscription deleted', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.deleted', {
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(mocks.tenantUpdate).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { plan: 'free', stripeSubscriptionId: null },
      select: { slug: true },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'plan.downgraded' }) }),
    );
  });

  // ── invoice.payment_failed ──────────────────────────────────────────────

  it('sends failed payment email with tenant name and customer email', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('invoice.payment_failed', {
        metadata: { tenantId: 'tenant-1' },
        customer_email: 'owner@example.com',
      }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(mocks.tenantFindUnique).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      select: { name: true },
    });
    expect(mocks.sendPaymentFailedEmail).toHaveBeenCalledWith({
      email: 'owner@example.com',
      tenantName: 'Taqueria Norte',
    });
  });

  it('does not send email when tenant has no name', async () => {
    mocks.tenantFindUnique.mockResolvedValueOnce({ name: null });
    mocks.constructEvent.mockReturnValue(
      eventFor('invoice.payment_failed', {
        metadata: { tenantId: 'tenant-1' },
        customer_email: 'owner@example.com',
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());
    expect(mocks.sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  it('does not send email when customer_email is missing', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('invoice.payment_failed', {
        metadata: { tenantId: 'tenant-1' },
        customer_email: null,
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());
    expect(mocks.sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  it('does not send email when tenantId is missing from metadata', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('invoice.payment_failed', {
        metadata: {},
        customer_email: 'owner@example.com',
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());
    expect(mocks.sendPaymentFailedEmail).not.toHaveBeenCalled();
  });

  // ── Unhandled events ────────────────────────────────────────────────────

  it('returns 200 for unhandled event types without updating tenant', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.created', { metadata: { tenantId: 'tenant-1' } }),
    );
    const POST = await loadPOST();
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(mocks.tenantUpdate).not.toHaveBeenCalled();
  });

  // ── Audit log actions ───────────────────────────────────────────────────

  it('writes plan.upgraded audit action for subscription checkout', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('checkout.session.completed', {
        mode: 'subscription',
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
        customer: 'cus_1',
        subscription: 'sub_1',
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'plan.upgraded', tenantId: 'tenant-1' }),
      }),
    );
  });

  it('writes plan.downgraded audit action for subscription deleted', async () => {
    mocks.constructEvent.mockReturnValue(
      eventFor('customer.subscription.deleted', {
        metadata: { tenantId: 'tenant-1', plan: 'pro' },
      }),
    );
    const POST = await loadPOST();
    await POST(stripeRequest());

    expect(mocks.auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'plan.downgraded' }),
      }),
    );
  });
});
