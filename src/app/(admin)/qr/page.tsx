import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const qrUrl = `/api/qr/${tenant.slug}`;

  return (
    <>
      <AppHeader
        title="QR y compartir"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-4 px-4">
        <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
          <p className="text-sm font-semibold text-ink-600">Pega esto donde sea. Funciona siempre.</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink-900">{tenant.name}</h2>
        </Card>

        <Card className="flex flex-col items-center gap-4">
          <div className="relative h-[280px] w-[280px] overflow-hidden rounded-md border border-ink-100 bg-white">
            <Image
              src={qrUrl}
              alt={`QR del menú de ${tenant.name}`}
              fill
              sizes="280px"
              priority
              className="object-contain p-4"
            />
          </div>
          <div className="w-full rounded-md bg-crema-100 p-3">
            <p className="text-xs font-semibold uppercase text-ink-500">Link del menú</p>
            <p className="mt-1 break-all text-sm font-bold text-ink-900">{menuUrl}</p>
          </div>
          <QrShareActions menuUrl={menuUrl} />
          <Link href={`${qrUrl}?download=1`} className="w-full" prefetch={false}>
            <Button type="button" className="w-full">
              <Download size={18} />
              Descargar PNG
            </Button>
          </Link>
        </Card>
      </main>
    </>
  );
}
