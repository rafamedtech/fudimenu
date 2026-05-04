import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/guards/require-auth';

export const runtime = 'nodejs';

const EXPORT_ACTION = 'account.export_data';
const EXPORT_RATE_LIMIT_MS = 24 * 60 * 60 * 1000;

function secondsUntil(date: Date) {
  return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
}

export async function GET() {
  const ctx = await requireAuth();
  const prisma = getPrisma();
  const cutoff = new Date(Date.now() - EXPORT_RATE_LIMIT_MS);

  const lastExport = await prisma.auditLog.findFirst({
    where: {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: EXPORT_ACTION,
      createdAt: {
        gte: cutoff,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  });

  if (lastExport) {
    const nextAllowedAt = new Date(lastExport.createdAt.getTime() + EXPORT_RATE_LIMIT_MS);

    return NextResponse.json(
      {
        ok: false,
        error: 'rate_limited',
        nextAllowedAt: nextAllowedAt.toISOString(),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(secondsUntil(nextAllowedAt)),
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  const [tenant, categories, items, memberships] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        createdBy: true,
        slug: true,
        name: true,
        logoUrl: true,
        whatsappPhone: true,
        primaryColor: true,
        cuisineType: true,
        defaultLocale: true,
        currency: true,
        plan: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }),
    prisma.category.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.menuItem.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.membership.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        tenantId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    }),
  ]);

  if (!tenant || tenant.deletedAt) {
    return NextResponse.json(
      { ok: false, error: 'tenant_not_found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: EXPORT_ACTION,
      entityType: 'tenant',
      entityId: ctx.tenantId,
      metadata: {
        format: 'json',
        categories: categories.length,
        items: items.length,
        memberships: memberships.length,
      },
    },
  });

  const exportedAt = new Date();

  return NextResponse.json(
    {
      exportedAt: exportedAt.toISOString(),
      account: {
        userId: ctx.userId,
        email: ctx.email,
        activeTenantId: ctx.tenantId,
        role: ctx.role,
      },
      tenant,
      categories,
      items,
      memberships,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="fudimenu-export-${tenant.slug}-${exportedAt.toISOString().slice(0, 10)}.json"`,
      },
    },
  );
}
