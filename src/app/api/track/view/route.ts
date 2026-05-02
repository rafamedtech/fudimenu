import { isIP } from 'node:net';
import { NextResponse, type NextRequest } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { Locale, type Locale as LocaleValue } from '@/generated/prisma/enums';

type TrackViewPayload = {
  tenantId?: unknown;
  slug?: unknown;
  sessionId?: unknown;
  locale?: unknown;
  referrer?: unknown;
};

const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalLocale(value: unknown): LocaleValue | null {
  return value === Locale.es || value === Locale.en ? value : null;
}

function parseForwardedFor(value: string | null) {
  if (!value) return null;
  const match = value.match(/(?:^|[;,]\s*)for=(?:"?)([^";,]+)(?:"?)/i);
  return match?.[1] ?? null;
}

function cleanIpCandidate(value: string) {
  const trimmed = value.trim().replace(/^"|"$/g, '');

  if (trimmed.startsWith('[')) {
    const end = trimmed.indexOf(']');
    return end > 0 ? trimmed.slice(1, end) : trimmed;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(trimmed)) {
    return trimmed.slice(0, trimmed.lastIndexOf(':'));
  }

  return trimmed.split('%')[0];
}

function ipv4ToGroups(ip: string) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }

  return [
    ((parts[0] << 8) | parts[1]).toString(16),
    ((parts[2] << 8) | parts[3]).toString(16),
  ];
}

function expandIpv6Groups(ip: string) {
  const normalized = ip.toLowerCase();
  const dottedMatch = normalized.match(/(.+):(\d{1,3}(?:\.\d{1,3}){3})$/);
  const expandedDotted = dottedMatch
    ? `${dottedMatch[1]}:${ipv4ToGroups(dottedMatch[2])?.join(':') ?? ''}`
    : normalized;
  const [left = '', right = ''] = expandedDotted.split('::');
  const leftGroups = left ? left.split(':').filter(Boolean) : [];
  const rightGroups = right ? right.split(':').filter(Boolean) : [];
  const missingGroups = Math.max(0, 8 - leftGroups.length - rightGroups.length);

  return [
    ...leftGroups,
    ...Array.from({ length: missingGroups }, () => '0'),
    ...rightGroups,
  ].slice(0, 8);
}

export function anonymizeIp(ip: string | null) {
  if (!ip) return null;

  const candidate = cleanIpCandidate(ip);
  const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];

  if (mappedIpv4 || isIP(candidate) === 4) {
    const ipv4 = mappedIpv4 ?? candidate;
    const parts = ipv4.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  if (isIP(candidate) === 6) {
    return expandIpv6Groups(candidate)
      .slice(0, 3)
      .map((group) => group.replace(/^0+([0-9a-f])/, '$1'))
      .join(':');
  }

  return null;
}

function getRequestIp(headers: Headers) {
  for (const header of IP_HEADERS) {
    const value = headers.get(header);
    const firstIp = value?.split(',')[0];
    if (firstIp) return firstIp;
  }

  return parseForwardedFor(headers.get('forwarded'));
}

export async function POST(request: NextRequest) {
  let payload: TrackViewPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const tenantId = optionalString(payload.tenantId);
  const slug = optionalString(payload.slug);

  if (!tenantId && !slug) {
    return NextResponse.json({ ok: false, error: 'missing_tenant' }, { status: 400 });
  }

  const prisma = getPrisma();
  const tenant = tenantId
    ? await prisma.tenant.findUnique({ where: { id: tenantId } })
    : await prisma.tenant.findUnique({ where: { slug: slug! } });

  if (!tenant || tenant.deletedAt) {
    return NextResponse.json({ ok: false, error: 'tenant_not_found' }, { status: 404 });
  }

  const menuView = await prisma.menuView.create({
    data: {
      tenantId: tenant.id,
      sessionId: optionalString(payload.sessionId),
      locale: optionalLocale(payload.locale),
      referrer: optionalString(payload.referrer) ?? request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ipHash: anonymizeIp(getRequestIp(request.headers)),
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({ ok: true, menuViewId: menuView.id });
}
