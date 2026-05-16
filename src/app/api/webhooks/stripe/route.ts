import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Prisma } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/db/prisma';
import { billingService } from '@/server/services/billing.service';
import { getPostHogClient } from '@/lib/posthog-server';

export const runtime = 'nodejs';

const STRIPE_API_VERSION = '2025-02-24.acacia';
const PAID_PLANS = new Set(['pro', 'business']);

let stripeClient: Stripe | null = null;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('missing_stripe_secret_key');

  stripeClient ??= new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  return stripeClient;
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('missing_stripe_webhook_secret');
  return secret;
}

function getPaidPlan(metadata?: Stripe.Metadata | null) {
  const plan = metadata?.plan;
  return PAID_PLANS.has(plan ?? '') ? (plan as 'pro' | 'business') : null;
}

function getTenantId(metadata?: Stripe.Metadata | null) {
  return metadata?.tenantId || null;
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function isSubscriptionPeriodEnded(subscription: Stripe.Subscription) {
  const end = subscription.current_period_end;
  return typeof end === 'number' && end <= Math.floor(Date.now() / 1000);
}

async function recordWebhookEvent(event: Stripe.Event, tenantId: string | null) {
  try {
    await getPrisma().webhookEvent.create({
      data: {
        tenantId,
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
        status: 'processed',
        processedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) return false;
    throw error;
  }
}

async function writeAuditLog(
  event: Stripe.Event,
  tenantId: string | null,
  action: string,
) {
  await getPrisma().auditLog.create({
    data: {
      tenantId,
      action,
      entityType: 'stripe_event',
      metadata: { eventId: event.id, tenantId, eventType: event.type },
    },
  });
}

async function updateTenantPlan(
  tenantId: string | null,
  plan: 'pro' | 'business' | 'free' | null,
  extra: { stripeCustomerId?: string | null; stripeSubscriptionId?: string | null } = {},
) {
  if (!tenantId || !plan) return;

  await getPrisma().tenant.update({
    where: { id: tenantId },
    data: {
      plan,
      ...(extra.stripeCustomerId !== undefined ? { stripeCustomerId: extra.stripeCustomerId } : {}),
      ...(extra.stripeSubscriptionId !== undefined
        ? { stripeSubscriptionId: extra.stripeSubscriptionId }
        : {}),
    },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const tenantId = getTenantId(invoice.metadata);
  if (!tenantId) return tenantId;

  const tenant = await getPrisma().tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  const email = invoice.customer_email;
  if (tenant?.name && email) {
    await billingService.sendPaymentFailedEmail({ email, tenantName: tenant.name });
  } else {
    console.warn('invoice.payment_failed: could not send email', {
      tenantId,
      hasTenantName: !!tenant?.name,
      hasEmail: !!email,
    });
  }

  return tenantId;
}

type ProcessResult = { tenantId: string | null; auditAction: string };

async function processEvent(event: Stripe.Event): Promise<ProcessResult> {
  const defaultAction = `stripe.${event.type}`;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = getTenantId(session.metadata);
      const paidPlan = getPaidPlan(session.metadata);
      const customerId =
        typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id ?? null;

      if (session.mode === 'subscription' && paidPlan) {
        await updateTenantPlan(tenantId, paidPlan, {
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
        });
        return { tenantId, auditAction: 'plan.upgraded' };
      }

      if (session.mode === 'payment' && session.payment_status === 'paid' && paidPlan) {
        await updateTenantPlan(tenantId, paidPlan, {
          ...(customerId ? { stripeCustomerId: customerId } : {}),
          stripeSubscriptionId: null,
        });
        return { tenantId, auditAction: 'plan.upgraded' };
      }

      return { tenantId, auditAction: defaultAction };
    }

    case 'charge.succeeded': {
      const charge = event.data.object as Stripe.Charge;
      const tenantId = getTenantId(charge.metadata);
      const paidPlan = getPaidPlan(charge.metadata);
      if (paidPlan) await updateTenantPlan(tenantId, paidPlan, { stripeSubscriptionId: null });
      return { tenantId, auditAction: paidPlan ? 'plan.upgraded' : defaultAction };
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const tenantId = getTenantId(pi.metadata);
      const paidPlan = getPaidPlan(pi.metadata);
      if (paidPlan) await updateTenantPlan(tenantId, paidPlan, { stripeSubscriptionId: null });
      return { tenantId, auditAction: paidPlan ? 'plan.upgraded' : defaultAction };
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = getTenantId(subscription.metadata);
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

      const shouldDowngrade =
        subscription.status === 'canceled' ||
        (subscription.cancel_at_period_end && isSubscriptionPeriodEnded(subscription));

      if (shouldDowngrade) {
        await updateTenantPlan(tenantId, 'free', { stripeSubscriptionId: null });
        return { tenantId, auditAction: 'plan.downgraded' };
      }

      if (subscription.status === 'active' || subscription.status === 'trialing') {
        const paidPlan = getPaidPlan(subscription.metadata);
        await updateTenantPlan(tenantId, paidPlan, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
        });
        return { tenantId, auditAction: paidPlan ? 'plan.upgraded' : defaultAction };
      }

      return { tenantId, auditAction: defaultAction };
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = getTenantId(subscription.metadata);
      await updateTenantPlan(tenantId, 'free', { stripeSubscriptionId: null });
      return { tenantId, auditAction: 'plan.downgraded' };
    }

    case 'invoice.payment_failed': {
      const tenantId = await handlePaymentFailed(event.data.object as Stripe.Invoice);
      return { tenantId, auditAction: 'stripe.invoice.payment_failed' };
    }

    default:
      console.info('Ignoring Stripe webhook event', { eventId: event.id, type: event.type });
      return { tenantId: null, auditAction: defaultAction };
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature ?? '', getWebhookSecret());
  } catch {
    return new NextResponse('invalid_signature', { status: 400 });
  }

  const initialTenantId = getTenantId(
    (event.data.object as { metadata?: Stripe.Metadata | null }).metadata,
  );
  const shouldProcess = await recordWebhookEvent(event, initialTenantId);
  if (!shouldProcess) return NextResponse.json({ received: true }, { status: 200 });

  const { tenantId, auditAction } = await processEvent(event);
  await writeAuditLog(event, tenantId ?? initialTenantId, auditAction);

  const resolvedTenantId = tenantId ?? initialTenantId;
  if (resolvedTenantId) {
    const posthog = getPostHogClient();
    if (posthog) {
      if (auditAction === 'plan.upgraded') {
        const plan = getPaidPlan((event.data.object as { metadata?: Stripe.Metadata | null }).metadata);
        posthog.capture({ distinctId: resolvedTenantId, event: 'plan_upgraded', properties: { to: plan ?? 'unknown', stripe_event: event.type } });
      } else if (auditAction === 'plan.downgraded') {
        posthog.capture({ distinctId: resolvedTenantId, event: 'plan_downgraded', properties: { to: 'free', stripe_event: event.type } });
      } else if (auditAction === 'stripe.invoice.payment_failed') {
        posthog.capture({ distinctId: resolvedTenantId, event: 'payment_failed', properties: { stripe_event: event.type } });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
