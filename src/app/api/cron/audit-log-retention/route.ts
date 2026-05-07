import { NextResponse, type NextRequest } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

const RETENTION_DAYS = 90;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 1000;

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (!expectedAuth || auth !== expectedAuth) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  const cutoff = new Date(Date.now() - RETENTION_MS);
  const prisma = getPrisma();

  const wouldDelete = await prisma.auditLog.count({
    where: { createdAt: { lt: cutoff } },
  });

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldDelete,
      cutoff: cutoff.toISOString(),
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: null,
      actorUserId: null,
      action: 'audit_log.retention',
      entityType: 'cron',
      entityId: null,
      metadata: {
        cutoff: cutoff.toISOString(),
        retentionDays: RETENTION_DAYS,
        batchSize: BATCH_SIZE,
        wouldDelete,
      },
    },
  });

  console.info('audit-log-retention starting', {
    cutoff: cutoff.toISOString(),
    wouldDelete,
    batchSize: BATCH_SIZE,
  });

  let totalDeleted = 0;

  while (true) {
    // eslint-disable-next-line fudimenu/require-tenant-id-in-prisma-findmany -- Cron de retencion borra entre tenants por diseno.
    const batch = await prisma.auditLog.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) break;

    const result = await prisma.auditLog.deleteMany({
      where: { id: { in: batch.map((item) => item.id) } },
    });
    totalDeleted += result.count;

    console.info('audit-log-retention batch deleted', {
      deleted: result.count,
      totalDeleted,
    });

    if (batch.length < BATCH_SIZE) break;
  }

  return NextResponse.json({
    ok: true,
    deleted: totalDeleted,
    wouldDelete,
    cutoff: cutoff.toISOString(),
  });
}
