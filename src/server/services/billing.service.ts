import 'server-only';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPrisma } from '@/lib/db/prisma';

const PRO_TRIAL_DAYS = 14;
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = 'FudiMenu <noreply@fudimenu.app>';

type TrialTenantInput = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userId: string;
  email: string;
};

type TrialReminderDay = 12;

let stripeClient: Stripe | null = null;
const CANCELABLE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'active',
  'incomplete',
  'past_due',
  'paused',
  'trialing',
  'unpaid',
]);

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

function getProPriceId() {
  return process.env.STRIPE_PRICE_PRO ?? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? null;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

async function sendEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { sent: false, reason: 'missing_resend_api_key' as const };

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) return { sent: false, reason: 'resend_error' as const };
  return { sent: true, reason: null };
}

function getTrialDayWindow(day: number, now = new Date()) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

async function hasCard(stripe: Stripe, customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);

  if (customer.deleted) return false;

  const invoiceSettingsPaymentMethod = customer.invoice_settings.default_payment_method;
  if (invoiceSettingsPaymentMethod) return true;

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 1,
  });

  return paymentMethods.data.length > 0;
}

async function getUserEmail(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) return null;
  return data.user?.email ?? null;
}

async function findSubscriptionsByTenant(stripe: Stripe, tenantId: string) {
  const query = `metadata['tenantId']:'${tenantId.replace(/'/g, "\\'")}'`;

  try {
    const result = await stripe.subscriptions.search({
      query,
      limit: 100,
    });

    return result.data;
  } catch {
    const result = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
    });

    return result.data.filter((subscription) => subscription.metadata.tenantId === tenantId);
  }
}

export const billingService = {
  async startProTrialForTenant(input: TrialTenantInput) {
    const stripe = getStripe();
    const priceId = getProPriceId();

    if (!stripe || !priceId) {
      await sendEmail({
        to: input.email,
        subject: 'Tu prueba Pro termina en 14 días',
        text: [
          `Hola, tu prueba Pro de ${input.tenantName} ya está activa por ${PRO_TRIAL_DAYS} días.`,
          '',
          `Entra a tu panel: ${getAppUrl()}/dashboard`,
        ].join('\n'),
      });

      return { ok: true as const, stripeEnabled: false as const };
    }

    const metadata = {
      tenantId: input.tenantId,
      tenantSlug: input.tenantSlug,
      userId: input.userId,
      plan: 'pro',
    };

    const customer = await stripe.customers.create(
      {
        email: input.email,
        name: input.tenantName,
        metadata,
      },
      { idempotencyKey: `tenant:${input.tenantId}:customer` },
    );

    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: PRO_TRIAL_DAYS,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        metadata,
      },
      { idempotencyKey: `tenant:${input.tenantId}:pro-trial` },
    );

    await sendEmail({
      to: input.email,
      subject: 'Tu prueba Pro termina en 14 días',
      text: [
        `Hola, tu prueba Pro de ${input.tenantName} ya está activa por ${PRO_TRIAL_DAYS} días.`,
        '',
        `Entra a tu panel: ${getAppUrl()}/dashboard`,
      ].join('\n'),
    });

    return {
      ok: true as const,
      stripeEnabled: true as const,
      customerId: customer.id,
      subscriptionId: subscription.id,
    };
  },

  async sendTrialReminderEmails(day: TrialReminderDay = 12) {
    const prisma = getPrisma();
    const { start, end } = getTrialDayWindow(day);
    const tenants = await prisma.tenant.findMany({
      where: {
        plan: 'pro',
        deletedAt: null,
        createdAt: {
          gte: start,
          lt: end,
        },
        auditLogs: {
          none: {
            action: `billing.trial_d${day}_email_sent`,
          },
        },
      },
      select: {
        id: true,
        name: true,
        memberships: {
          where: {
            deletedAt: null,
            role: 'owner',
          },
          take: 1,
          select: {
            userId: true,
          },
        },
      },
    });

    const results = await Promise.all(
      tenants.map(async (tenant) => {
        const owner = tenant.memberships[0];
        if (!owner) return { tenantId: tenant.id, sent: false, reason: 'missing_owner' as const };

        const email = await getUserEmail(owner.userId);
        if (!email) return { tenantId: tenant.id, sent: false, reason: 'missing_email' as const };

        const result = await sendEmail({
          to: email,
          subject: '2 días restantes — qué incluye Pro',
          text: [
            `Quedan 2 días de prueba Pro para ${tenant.name}.`,
            '',
            'Pro incluye items ilimitados, sucursales ilimitadas, analytics básico, especiales y cero marca FudiMenu.',
            `Revisa tu plan: ${getAppUrl()}/settings/billing`,
          ].join('\n'),
        });

        if (result.sent) {
          await prisma.auditLog.create({
            data: {
              tenantId: tenant.id,
              actorUserId: owner.userId,
              action: `billing.trial_d${day}_email_sent`,
              entityType: 'tenant',
              entityId: tenant.id,
              metadata: { day },
            },
          });
        }

        return { tenantId: tenant.id, ...result };
      }),
    );

    return {
      checked: tenants.length,
      sent: results.filter((result) => result.sent).length,
      results,
    };
  },

  async downgradeExpiredTrialsWithoutCard() {
    const stripe = getStripe();
    if (!stripe) return { checked: 0, downgraded: 0, stripeEnabled: false as const };

    const endedBefore = Math.floor(Date.now() / 1000);
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
    });

    let downgraded = 0;
    const prisma = getPrisma();

    for (const subscription of subscriptions.data) {
      const tenantId = subscription.metadata.tenantId;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

      if (!tenantId || !subscription.trial_end || subscription.trial_end > endedBefore) continue;
      if (await hasCard(stripe, customerId)) continue;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: 'free' },
      });

      if (subscription.status !== 'canceled') {
        await stripe.subscriptions.cancel(subscription.id);
      }
      downgraded += 1;
    }

    return { checked: subscriptions.data.length, downgraded, stripeEnabled: true as const };
  },

  async cancelSubscriptionsForTenant(tenantId: string) {
    const stripe = getStripe();
    if (!stripe) return { stripeEnabled: false as const, checked: 0, canceled: 0 };

    const subscriptions = await findSubscriptionsByTenant(stripe, tenantId);
    let canceled = 0;

    for (const subscription of subscriptions) {
      if (!CANCELABLE_SUBSCRIPTION_STATUSES.has(subscription.status)) continue;

      await stripe.subscriptions.cancel(subscription.id);
      canceled += 1;
    }

    return { stripeEnabled: true as const, checked: subscriptions.length, canceled };
  },

  async sendAccountDeletionEmail(input: { email: string; tenantName: string }) {
    return sendEmail({
      to: input.email,
      subject: 'Confirmación de eliminación de cuenta',
      text: [
        `Confirmamos la eliminación de la cuenta de ${input.tenantName}.`,
        '',
        'El acceso al restaurante quedó desactivado. Conservaremos los datos durante 30 días para completar el proceso y después se eliminarán automáticamente.',
        '',
        `Si esto fue un error, contáctanos desde ${getAppUrl()}.`,
      ].join('\n'),
    });
  },
};
