import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Prisma } from '@/generated/prisma/client';
import { getPrisma } from '@/lib/db/prisma';
import { billingService } from '@/server/services/billing.service';

export const runtime = 'nodejs';

const STRIPE_API_VERSION = '2025-02-24.acacia';
const PAID_PLANS = new Set(['pro', 'business']);

let stripeClient: Stripe | null = null;

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('missing_stripe_secret_key');

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
  });

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
  const currentPeriodEnd = subscription.current_period_end;
  return typeof currentPeriodEnd === 'number' && currentPeriodEnd <= Math.floor(Date.now() / 1000);
}

async function recordWebhookEvent(event: Stripe.Event, tenantId: string | null) {
  const prisma = getPrisma();

  try {
    await prisma.webhookEvent.create({
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

async function writeAuditLog(event: Stripe.Event, tenantId: string | null) {
  await getPrisma().auditLog.create({
    data: {
      tenantId,
      action: `stripe.${event.type}`,
      entityType: 'stripe_event',
      metadata: {
        eventId: event.id,
        tenantId,
      },
    },
  });
}

async function updateTenantPlan(tenantId: string | null, plan: 'pro' | 'business' | 'free' | null) {
  if (!tenantId || !plan) return;

  await getPrisma().tenant.update({
    where: { id: tenantId },
    data: { plan },
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
    await billingService.sendPaymentFailedEmail({
      email,
      tenantName: tenant.name,
    });
  }

  return tenantId;
}

async function processEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = getTenantId(session.metadata);

      if (session.mode === 'payment' && session.payment_status === 'paid') {
        await updateTenantPlan(tenantId, getPaidPlan(session.metadata));
      }

      return tenantId;
    }

    case 'charge.succeeded': {
      const charge = event.data.object as Stripe.Charge;
      const tenantId = getTenantId(charge.metadata);
      await updateTenantPlan(tenantId, getPaidPlan(charge.metadata));
      return tenantId;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const tenantId = getTenantId(paymentIntent.metadata);
      await updateTenantPlan(tenantId, getPaidPlan(paymentIntent.metadata));
      return tenantId;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = getTenantId(subscription.metadata);

      if (subscription.status === 'canceled' || (subscription.cancel_at_period_end && isSubscriptionPeriodEnded(subscription))) {
        await updateTenantPlan(tenantId, 'free');
      }

      return tenantId;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = getTenantId(subscription.metadata);
      await updateTenantPlan(tenantId, 'free');
      return tenantId;
    }

    case 'invoice.payment_failed':
      return handlePaymentFailed(event.data.object as Stripe.Invoice);

    default: {
      console.info('Ignoring Stripe webhook event', { eventId: event.id, type: event.type });
      return null;
    }
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

  const initialTenantId = getTenantId((event.data.object as { metadata?: Stripe.Metadata | null }).metadata);
  const shouldProcess = await recordWebhookEvent(event, initialTenantId);
  if (!shouldProcess) return NextResponse.json({ received: true }, { status: 200 });

  const tenantId = await processEvent(event);
  await writeAuditLog(event, tenantId ?? initialTenantId);

  return NextResponse.json({ received: true }, { status: 200 });
}
