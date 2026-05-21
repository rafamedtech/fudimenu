import { Suspense } from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Doodle } from '@/components/brand/doodles';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { QrShareActions } from './qr-share-actions';

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export default async function QrPage() {
  const ctx = await requireAuth();
  const activeMembership = ctx.memberships.find((membership) => membership.tenantId === ctx.tenantId);

  return (
    <>
      <AppHeader
        title="QR y compartir"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <Suspense fallback={<QrPageLoading />}>
        <QrPageContent
          tenantId={ctx.tenantId}
          tenantSlug={activeMembership?.tenant.slug ?? null}
        />
      </Suspense>
    </>
  );
}

async function QrPageContent({
  tenantId,
  tenantSlug,
}: {
  tenantId: string;
  tenantSlug: string | null;
}) {
  const tenant = tenantSlug ? await menuService.getCachedTenantBySlug(tenantSlug) : null;

  if (!tenant) {
    throw new Error('tenant_not_found');
  }

  const menuUrl = `${getBaseUrl()}/m/${tenant.slug}`;
  const qrImagePath = `/api/qr/${tenant.slug}`;
  const qrImageUrl = `${getBaseUrl()}${qrImagePath}`;

  return (
    <main className="grid gap-4 px-4 ipad:px-6 ipad-landscape:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] ipad-landscape:items-start ipad-landscape:px-7 desktop:px-8">
        <Card className="overflow-hidden border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-6">
          <p className="text-sm font-semibold text-ink-600">Pega esto donde sea. Funciona siempre.</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink-900 ipad:text-3xl">{tenant.name}</h2>
          <Doodle name="qr-phone" className="mx-auto mt-4 h-44 w-56 ipad:h-56 ipad:w-72" />
          <div className="mt-4 rounded-lg bg-white/70 p-4">
            <p className="text-xs font-black uppercase text-ink-500">QR de referidos</p>
            <p className="mt-1 text-sm font-semibold text-ink-700">
              Comparte tu código para invitar a otros restauranteros.
            </p>
          </div>
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
            tenantId={tenantId}
          />
        </Card>
    </main>
  );
}

function QrPageLoading() {
  return (
    <main className="grid gap-4 px-4 ipad:px-6 ipad-landscape:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] ipad-landscape:items-start ipad-landscape:px-7 desktop:px-8">
      <Card className="space-y-4 overflow-hidden border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-6">
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="mx-auto mt-4 h-44 w-56 ipad:h-56 ipad:w-72" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </Card>
      <Card className="flex flex-col items-center gap-4 ipad:p-6">
        <Skeleton className="h-[280px] w-[280px] rounded-md ipad:h-[340px] ipad:w-[340px]" />
        <Skeleton className="h-16 w-full rounded-md" />
        <div className="grid w-full gap-3 ipad:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </Card>
    </main>
  );
}
