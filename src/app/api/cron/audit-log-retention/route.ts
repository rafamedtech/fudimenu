import { getPrisma } from '@/lib/db/prisma';

const AUDIT_LOG_RETENTION_DAYS = 90;
const AUDIT_LOG_RETENTION_MS = AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function authenticateCron(request: Request) {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!authenticateCron(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_MS);
  const result = await getPrisma().auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  return Response.json({
    ok: true,
    deletedAuditLogs: result.count,
    cutoff: cutoff.toISOString(),
  });
}
