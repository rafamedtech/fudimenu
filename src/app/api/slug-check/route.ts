import { NextRequest, NextResponse } from 'next/server';
import { checkTenantSlugAvailability } from '@/server/services/slug.service';
import { requireAuth } from '@/server/guards/require-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
