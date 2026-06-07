'use server';

import { requireAuth } from '@/server/guards/require-auth';
import { markTenantQrDownloaded } from '@/server/services/qr-activation.service';

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function getShareMenuUrlAction() {
  const ctx = await requireAuth();
  const membership = ctx.memberships.find((item) => item.tenantId === ctx.tenantId);
  const slug = membership?.tenant.slug;

  if (!slug) return { ok: false as const, error: 'missing_tenant' };

  return {
    ok: true as const,
    url: `${getBaseUrl()}/m/${slug}`,
    title: membership.tenant.name,
  };
}

export async function markQrDownloadedAction() {
  const ctx = await requireAuth();
  const membership = ctx.memberships.find((item) => item.tenantId === ctx.tenantId);
  const slug = membership?.tenant.slug;

  if (!slug) return { ok: false as const, error: 'missing_tenant' };

  await markTenantQrDownloaded(slug);
  return { ok: true as const };
}
