import { createClient } from '@supabase/supabase-js';
import { getPrisma } from '@/lib/db/prisma';
import { getTodayNudgeWindow, SPECIALS_TIME_ZONE } from '@/lib/specials-time';

const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = 'FudiMenu <noreply@fudimenu.app>';

type NudgeRecipient = {
  email: string;
  tenantName: string;
  tenantSlug: string;
};

function authenticateCron(request: Request) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
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

async function sendNudgeEmail({ email, tenantName, tenantSlug }: NudgeRecipient) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { sent: false, reason: 'missing_resend_api_key' as const };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const dashboardUrl = `${appUrl}/dashboard`;
  const publicMenuUrl = `${appUrl}/m/${tenantSlug}`;
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email,
      subject: `¿Especial de hoy en ${tenantName}?`,
      text: [
        `Tu menú de ${tenantName} todavía no tiene Especial de hoy.`,
        '',
        `Agrégalo aquí: ${dashboardUrl}`,
        `Vista comensal: ${publicMenuUrl}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) return { sent: false, reason: 'resend_error' as const };
  return { sent: true, reason: null };
}

export async function GET(request: Request) {
  if (!authenticateCron(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { startOfDay, tenAm } = getTodayNudgeWindow();
  const prisma = getPrisma();
  const tenants = await prisma.tenant.findMany({
    where: {
      deletedAt: null,
      memberships: {
        some: {
          deletedAt: null,
          role: { in: ['owner', 'admin'] },
        },
      },
      items: {
        none: {
          deletedAt: null,
          isSpecialToday: true,
          updatedAt: {
            gte: startOfDay,
            lt: tenAm,
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      memberships: {
        where: {
          deletedAt: null,
          role: { in: ['owner', 'admin'] },
        },
        select: {
          userId: true,
        },
      },
    },
  });

  const recipients: NudgeRecipient[] = [];
  const seen = new Set<string>();

  for (const tenant of tenants) {
    for (const membership of tenant.memberships) {
      const email = await getUserEmail(membership.userId);
      if (!email) continue;

      const key = `${tenant.id}:${email}`;
      if (seen.has(key)) continue;
      seen.add(key);

      recipients.push({
        email,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
      });
    }
  }

  const results = await Promise.all(recipients.map(sendNudgeEmail));
  const sent = results.filter((result) => result.sent).length;

  return Response.json({
    ok: true,
    tenantsChecked: tenants.length,
    recipients: recipients.length,
    sent,
    skipped: recipients.length - sent,
    window: {
      startOfDay: startOfDay.toISOString(),
      tenAm: tenAm.toISOString(),
      timeZone: SPECIALS_TIME_ZONE,
    },
  });
}
