import { getPrisma } from '@/lib/db/prisma';

const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_MS);
  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';
  const prisma = getPrisma();

  if (dryRun) {
    const [tenants, items] = await Promise.all([
      prisma.tenant.count({
        where: {
          deletedAt: {
            lt: cutoff,
          },
        },
      }),
      prisma.menuItem.count({
        where: {
          deletedAt: {
            lt: cutoff,
          },
          tenant: {
            deletedAt: null,
          },
        },
      }),
    ]);

    return Response.json({
      ok: true,
      dryRun: true,
      wouldDeleteTenants: tenants,
      wouldDeleteItems: items,
      cutoff: cutoff.toISOString(),
    });
  }

  const [deletedTenants, deletedItems] = await prisma.$transaction([
    prisma.tenant.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
      },
    }),
    prisma.menuItem.deleteMany({
      where: {
        deletedAt: {
          lt: cutoff,
        },
        tenant: {
          deletedAt: null,
        },
      },
    }),
  ]);

  return Response.json({
    ok: true,
    deletedTenants: deletedTenants.count,
    deletedItems: deletedItems.count,
    cutoff: cutoff.toISOString(),
  });
}
