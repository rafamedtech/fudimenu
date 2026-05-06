import { createHash, randomInt } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/ratelimit';
import { requireAuth } from '@/server/guards/require-auth';
import { hashDeleteToken } from '@/server/services/account-delete-otp.service';
import { billingService } from '@/server/services/billing.service';

export const runtime = 'nodejs';

const EXPIRY_MINUTES = 15;

function noStore(status = 200) {
  return { status, headers: { 'Cache-Control': 'no-store' } };
}

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(request: NextRequest) {
  const ctx = await requireAuth();

  if (ctx.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, noStore(403));
  }

  const rateLimit = await checkRateLimit(ctx.userId, {
    identifier: 'account-delete-request',
    requests: 3,
    windowSec: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', resetSec: rateLimit.resetSec },
      noStore(429),
    );
  }

  const prisma = getPrisma();
  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { id: true, name: true, deletedAt: true },
  });

  if (!tenant || tenant.deletedAt) {
    return NextResponse.json({ ok: false, error: 'tenant_not_found' }, noStore(404));
  }

  const code = randomInt(100_000, 1_000_000).toString();
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  await prisma.accountDeleteRequest.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      codeHash: await hashDeleteToken(code),
      expiresAt,
      ipHash: hashIp(getClientIp(request.headers)),
    },
  });

  const email = await billingService.sendAccountDeleteCodeEmail({
    email: ctx.email,
    tenantName: tenant.name,
    code,
  });

  return NextResponse.json(
    { ok: true, expiresAt: expiresAt.toISOString(), email },
    noStore(),
  );
}
