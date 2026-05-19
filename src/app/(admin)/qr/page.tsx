import Image from 'next/image';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { QrShareActions } from './qr-share-actions';

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export default async function QrPage() {
  const ctx = await requireAuth();
  const activeMembership = ctx.memberships.find((membership) => membership.tenantId === ctx.tenantId);
  const tenant = activeMembership
    ? await menuService.getTenantBySlug(activeMembership.tenant.slug)
    : null;

  if (!tenant) {
    throw new Error('tenant_not_found');
  }

  const menuUrl = `${getBaseUrl()}/m/${tenant.slug}`;
  const qrImagePath = `/api/qr/${tenant.slug}`;
  const qrImageUrl = `${getBaseUrl()}${qrImagePath}`;

  return (
    <>
      <AppHeader
        title="QR y compartir"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="grid gap-4 px-4 ipad:px-6 ipad-landscape:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] ipad-landscape:items-start ipad-landscape:px-7 desktop:px-8">
        <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-6">
          <p className="text-sm font-semibold text-ink-600">Pega esto donde sea. Funciona siempre.</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink-900">{tenant.name}</h2>
        </Card>

        <Card className="flex flex-col items-center gap-4 ipad:p-6">
          <div className="relative h-[280px] w-[280px] overflow-hidden rounded-md border border-ink-100 bg-[var(--brand-card)] ipad:h-[340px] ipad:w-[340px]">
            <Image
              src={qrImagePath}
              alt={`QR del menú de ${tenant.name}`}
              fill
              sizes="(min-width: 768px) 340px, 280px"
              priority
              unoptimized
              className="object-contain p-4"
            />
          </div>
          <div className="w-full rounded-md bg-[var(--brand-surface-strong)] p-3">
            <p className="text-xs font-semibold uppercase text-ink-500">Link del menú</p>
            <p className="mt-1 break-all text-sm font-bold text-ink-900">{menuUrl}</p>
          </div>
          <QrShareActions
            menuUrl={menuUrl}
            qrImageUrl={qrImageUrl}
            downloadUrl={`${qrImageUrl}?download=1`}
            tenantId={tenant.id}
          />
        </Card>
      </main>
    </>
  );
}
