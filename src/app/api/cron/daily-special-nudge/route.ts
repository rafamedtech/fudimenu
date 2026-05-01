import { createClient } from '@supabase/supabase-js';
import { getPrisma } from '@/lib/db/prisma';

const APP_TIME_ZONE = 'America/Tijuana';
const RESEND_API_URL = 'https://api.resend.com/emails';
const EMAIL_FROM = 'FudiMenu <noreply@fudimenu.app>';

type LocalDateParts = {
  year: number;
  month: number;
  day: number;
};

type NudgeRecipient = {
  email: string;
  tenantName: string;
  tenantSlug: string;
};

function authenticateCron(request: Request) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((item) => item.type === 'timeZoneName')?.value;

  const match = part?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes) * 60 * 1000;
}

function localTimeToUtc(
  { year, month, day }: LocalDateParts,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(utcGuess.getTime() - getTimeZoneOffsetMs(utcGuess, timeZone));
}

function getTodayNudgeWindow(now = new Date()) {
  const localDate = getLocalDateParts(now, APP_TIME_ZONE);

  return {
    startOfDay: localTimeToUtc(localDate, 0, 0, APP_TIME_ZONE),
    tenAm: localTimeToUtc(localDate, 10, 0, APP_TIME_ZONE),
  };
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
      timeZone: APP_TIME_ZONE,
    },
  });
}
