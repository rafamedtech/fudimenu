import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { billingService } from '@/server/services/billing.service';
import { requireAuth } from '@/server/guards/require-auth';

export const runtime = 'nodejs';

const ACCOUNT_DELETE_ACTION = 'account.delete_requested';

export async function DELETE() {
  const ctx = await requireAuth();

  if (ctx.role !== 'owner') {
    return NextResponse.json(
      { ok: false, error: 'forbidden' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
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
    return NextResponse.json(
      { ok: false, error: 'tenant_not_found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const stripe = await billingService.cancelSubscriptionsForTenant(ctx.tenantId);
  const deletedAt = new Date();

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
