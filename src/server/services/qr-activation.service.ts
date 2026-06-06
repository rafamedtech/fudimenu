import 'server-only';
import { getPrisma } from '@/lib/db/prisma';

type QrDownloadedAtRow = {
  qr_downloaded_at: Date | null;
};

export async function getTenantQrDownloadedAt(tenantId: string): Promise<string | null> {
  const rows = await getPrisma().$queryRaw<QrDownloadedAtRow[]>`
    SELECT qr_downloaded_at
    FROM tenants
    WHERE id = ${tenantId}::uuid
      AND deleted_at IS NULL
    LIMIT 1
  `;

  return rows[0]?.qr_downloaded_at?.toISOString() ?? null;
}

export async function markTenantQrDownloaded(slug: string): Promise<void> {
  await getPrisma().$executeRaw`
    UPDATE tenants
    SET qr_downloaded_at = COALESCE(qr_downloaded_at, now())
    WHERE slug = ${slug}
      AND deleted_at IS NULL
  `;
}
