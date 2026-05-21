import 'server-only';
import { revalidateTag } from 'next/cache';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPrisma } from '@/lib/db/prisma';
import { env } from '@/lib/env';

const PRO_TRIAL_DAYS = 14;
const REFERRAL_CREDIT_CENTS = 14_900;
const REFERRAL_CREDIT_CURRENCY = 'mxn';
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = process.env.RESEND_FROM ?? 'FudiMenu <noreply@fudimenu.app>';

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

function revalidateTenantCache(tenantId: string, slug?: string | null) {
  revalidateTag(`menu:${tenantId}`);
  revalidateTag(`tenant:${tenantId}`);
  if (slug) revalidateTag(`tenant-slug:${slug}`);
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });

  return stripeClient;
}

function getProPriceId() {
  return env.STRIPE_PRICE_PRO ?? null;
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

  const override = process.env.DEV_EMAIL_OVERRIDE;
  const finalTo = override && process.env.NODE_ENV !== 'production' ? override : to;
  const finalSubject =
    override && process.env.NODE_ENV !== 'production' ? `[dev → ${to}] ${subject}` : subject;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: finalTo,
      subject: finalSubject,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('resend_error', { status: response.status, body, to, from: EMAIL_FROM });
    return { sent: false, reason: 'resend_error' as const };
  }
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

async function findStripeCustomerByUserId(stripe: Stripe, userId: string) {
  const query = `metadata['userId']:'${userId.replace(/'/g, "\\'")}'`;

  try {
    const result = await stripe.customers.search({
      query,
      limit: 1,
    });

    return result.data[0] ?? null;
  } catch {
    const result = await stripe.customers.list({
      limit: 100,
    });

    return result.data.find((customer) => customer.metadata.userId === userId) ?? null;
  }
}

async function applyReferralCreditForTenant(stripe: Stripe, tenantId: string) {
  const prisma = getPrisma();
  const referral = await prisma.referral.findFirst({
    where: {
      referredTenantId: tenantId,
      creditedAt: null,
      deletedAt: null,
      status: {
        not: 'cancelled',
      },
    },
    select: {
      id: true,
      code: true,
      referrerId: true,
    },
  });

  if (!referral) return { applied: false as const, reason: 'missing_referral' as const };

  const referrerCustomer = await findStripeCustomerByUserId(stripe, referral.referrerId);
  if (!referrerCustomer) return { applied: false as const, reason: 'missing_referrer_customer' as const };

  await stripe.customers.createBalanceTransaction(
    referrerCustomer.id,
    {
      amount: -REFERRAL_CREDIT_CENTS,
      currency: REFERRAL_CREDIT_CURRENCY,
      description: 'Credito por referido FudiMenu',
      metadata: {
        referralId: referral.id,
        referralCode: referral.code,
        referredTenantId: tenantId,
      },
    },
    { idempotencyKey: `referral:${referral.id}:credit:${REFERRAL_CREDIT_CENTS}${REFERRAL_CREDIT_CURRENCY}` },
  );

  await prisma.referral.updateMany({
    where: {
      id: referral.id,
      creditedAt: null,
    },
    data: {
      status: 'credited',
      creditedAt: new Date(),
    },
  });

  return {
    applied: true as const,
    referralId: referral.id,
    customerId: referrerCustomer.id,
    amount: REFERRAL_CREDIT_CENTS,
    currency: REFERRAL_CREDIT_CURRENCY,
  };
}

export const billingService = {
  async startProTrialForTenant(input: TrialTenantInput) {
    if (
      process.env.E2E_TEST_AUTH === 'true' &&
      process.env.E2E_STRIPE_CHECKOUT_MOCK === 'true' &&
      process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
    ) {
      return { ok: true as const, stripeEnabled: false as const };
    }

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

    const tenant = await getPrisma().tenant.update({
      where: { id: input.tenantId },
      data: {
        plan: 'pro',
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
      },
      select: { slug: true },
    });
    revalidateTenantCache(input.tenantId, tenant.slug);

    const referralCredit = await applyReferralCreditForTenant(stripe, input.tenantId);

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
      referralCredit,
    };
  },

  async sendTrialReminderEmails(day: TrialReminderDay = 12) {
    const prisma = getPrisma();
    const { start, end } = getTrialDayWindow(day);
    // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany -- Cron job intentionally scans eligible trial tenants across the platform.
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

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: 'free' },
        select: { slug: true },
      });
      revalidateTenantCache(tenantId, tenant.slug);

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

  async sendAccountDeleteCodeEmail(input: { email: string; tenantName: string; code: string }) {
    return sendEmail({
      to: input.email,
      subject: `Confirma eliminación de cuenta — código: ${input.code}`,
      text: [
        `Código para eliminar la cuenta de ${input.tenantName}: ${input.code}`,
        '',
        'Este código vence en 15 minutos.',
        '',
        'La eliminación desactivará el restaurante, sus platillos y el acceso del equipo. También cancelaremos suscripciones activas. Esta acción inicia el proceso irreversible de eliminación.',
        '',
        'Si no pediste esto, ignora este correo y cambia tu contraseña.',
      ].join('\n'),
    });
  },

  async sendPaymentFailedEmail(input: { email: string; tenantName: string }) {
    return sendEmail({
      to: input.email,
      subject: 'Falló el cobro de FudiMenu',
      text: [
        `No pudimos cobrar la suscripción de ${input.tenantName}.`,
        '',
        `Actualiza tu método de pago antes de que tu plan se cancele: ${getAppUrl()}/settings/billing`,
      ].join('\n'),
    });
  },
};
