import { NextResponse, type NextRequest } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { mockItems, mockTenant } from '@/lib/mock/data';
import { isMockRuntime } from '@/lib/mock/runtime';
import { billingService } from '@/server/services/billing.service';
import { requireAuth } from '@/server/guards/require-auth';
import {
  normalizeDeleteToken,
  verifyDeleteToken,
} from '@/server/services/account-delete-otp.service';

export const runtime = 'nodejs';

const ACCOUNT_DELETE_ACTION = 'account.delete_requested';

function noStore(status = 200) {
  return { status, headers: { 'Cache-Control': 'no-store' } };
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAuth();

  if (ctx.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'forbidden' }, noStore(403));
  }

  const token = normalizeDeleteToken(request.headers.get('x-delete-token'));
  if (!token) {
    return NextResponse.json({ ok: false, error: 'invalid_token' }, noStore(400));
  }

  if (isMockRuntime()) {
    if (token !== '123456') {
      return NextResponse.json({ ok: false, error: 'invalid_token' }, noStore(400));
    }

    const deletedAt = new Date();

    return NextResponse.json(
      {
        ok: true,
        deletedAt: deletedAt.toISOString(),
        hardDeleteAfter: new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        softDeleted: {
          tenant: true,
          memberships: 1,
          items: mockItems.length,
        },
        stripe: { cancelled: 0 },
        email: { sent: false, reason: 'mock_mode', tenantName: mockTenant.name },
      },
      noStore(),
    );
  }

  const prisma = getPrisma();

  const tenant = await prisma.tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      id: true,
      name: true,
      deletedAt: true,
    },
  });

  if (!tenant || tenant.deletedAt) {
    return NextResponse.json({ ok: false, error: 'tenant_not_found' }, noStore(404));
  }

  const now = new Date();
  const activeRequests = await prisma.accountDeleteRequest.findMany({
    where: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, codeHash: true },
  });

  let matchedRequestId: string | null = null;
  for (const deleteRequest of activeRequests) {
    if (await verifyDeleteToken(token, deleteRequest.codeHash)) {
      matchedRequestId = deleteRequest.id;
      break;
    }
  }

  if (!matchedRequestId) {
    return NextResponse.json({ ok: false, error: 'invalid_token' }, noStore(400));
  }

  const consumed = await prisma.accountDeleteRequest.updateMany({
    where: {
      id: matchedRequestId,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });

  if (consumed.count !== 1) {
    return NextResponse.json({ ok: false, error: 'invalid_token' }, noStore(400));
  }

  const stripe = await billingService.cancelSubscriptionsForTenant(ctx.tenantId);
  const deletedAt = now;

  const [, memberships, items] = await prisma.$transaction([
    prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: { deletedAt },
    }),
    prisma.membership.updateMany({
      where: {
        tenantId: ctx.tenantId,
        deletedAt: null,
      },
      data: { deletedAt },
    }),
    prisma.menuItem.updateMany({
      where: {
        tenantId: ctx.tenantId,
        deletedAt: null,
      },
      data: { deletedAt },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: ACCOUNT_DELETE_ACTION,
        entityType: 'tenant',
        entityId: ctx.tenantId,
        metadata: {
          membershipsSoftDeleted: true,
          itemsSoftDeleted: true,
          stripe,
        },
      },
    }),
  ]);

  const email = await billingService.sendAccountDeletionEmail({
    email: ctx.email,
    tenantName: tenant.name,
  });

  return NextResponse.json(
    {
      ok: true,
      deletedAt: deletedAt.toISOString(),
      hardDeleteAfter: new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      softDeleted: {
        tenant: true,
        memberships: memberships.count,
        items: items.count,
      },
      stripe,
      email,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
