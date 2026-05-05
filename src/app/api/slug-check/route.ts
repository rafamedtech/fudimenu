import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { checkTenantSlugAvailability } from '@/server/services/slug.service';
import { requireAuth } from '@/server/guards/require-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(getClientIp(request.headers), {
    identifier: 'slug-check',
    requests: 10,
    windowSec: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetSec), 'Cache-Control': 'no-store' } },
    );
  }

  const ctx = await requireAuth();
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  const result = await checkTenantSlugAvailability(slug, {
    currentTenantId: ctx.tenantId,
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
