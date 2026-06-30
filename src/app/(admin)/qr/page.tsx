import { Suspense } from 'react';
import Image from 'next/image';
import { Printer, Smartphone, Sticker } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Card } from '@/components/ui/card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { QrShareActions } from './qr-share-actions';
import { QrMaterials } from './qr-materials';

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

const USAGE_IDEAS = [
  {
    icon: Printer,
    title: 'Imprime y pega',
    body: 'En mesas, mostrador, ventanas o menús físicos.',
  },
  {
    icon: Sticker,
    title: 'Stickers tamaño tarjeta',
    body: 'Reparte con cada cuenta o pedido para llevar.',
  },
  {
    icon: Smartphone,
    title: 'En tus redes',
    body: 'Súbelo a stories de Instagram, WhatsApp o TikTok.',
  },
];

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
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
      <div className="grid gap-5 ipad-landscape:grid-cols-[minmax(440px,520px)_minmax(0,1fr)] ipad-landscape:items-start ipad-landscape:gap-7">
        {/* LEFT: sticky QR panel — live preview mirroring the downloadable A4 poster */}
        <div className="ipad-landscape:sticky ipad-landscape:top-24">
          <Card className="flex flex-col items-center gap-5 ipad:p-7 ipad-landscape:p-8">
            <SectionHeading
              title="Tu código QR"
              description="Así se ve tu cartel descargable."
              className="w-full"
              titleClassName="text-lg ipad:text-xl"
              meta={
                <span className="rounded-full bg-menta-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-menta-600">
                  Activo
                </span>
              }
            />

            <div className="w-full overflow-hidden rounded-xl border border-ink-100 bg-[#FFFCF5] shadow-md">
              <div aria-hidden className="h-2.5 w-full" style={{ backgroundColor: tenant.primaryColor }} />
              <div className="flex flex-col items-center px-6 py-8 text-center ipad:px-8 ipad:py-10">
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={`Logo de ${tenant.name}`}
                    width={96}
                    height={96}
                    unoptimized
                    className={
                      tenant.logoShape === 'round'
                        ? 'mb-4 size-16 rounded-full object-cover'
                        : 'mb-4 max-h-16 w-auto object-contain'
                    }
                  />
                ) : null}
                <p className="font-heading text-2xl font-extrabold leading-tight text-[#1A1611] ipad:text-3xl">
                  {tenant.name}
                </p>
                <p className="mt-1.5 text-sm text-[#6B5E4A]">Escanea y ve nuestro menú digital</p>

                <div className="mt-6 rounded-[20px] bg-white p-4 shadow-[0_4px_28px_rgba(26,22,17,0.10)] ipad:p-5">
                  <div className="relative h-[200px] w-[200px] ipad:h-[240px] ipad:w-[240px] ipad-landscape:h-[280px] ipad-landscape:w-[280px]">
                    <Image
                      src={qrImagePath}
                      alt={`QR del menú de ${tenant.name}`}
                      fill
                      sizes="(min-width: 1024px) 280px, (min-width: 768px) 240px, 200px"
                      priority
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>

                <p className="mt-6 break-all font-mono text-sm text-[#6B5E4A]">{menuUrl}</p>
                <span
                  aria-hidden
                  className="mt-2 h-[3px] w-12"
                  style={{ backgroundColor: tenant.primaryColor }}
                />
                <p className="mt-6 text-xs text-[#9B8E7B]">Creado con FudiMenu</p>
              </div>
              <div aria-hidden className="h-2.5 w-full" style={{ backgroundColor: tenant.primaryColor }} />
            </div>

            <QrShareActions
              menuUrl={menuUrl}
              qrImageUrl={qrImageUrl}
              downloadUrl={`${qrImageUrl}?download=1`}
              tenantId={tenantId}
            />
          </Card>
        </div>

        {/* RIGHT: ideas + materials */}
        <div className="flex flex-col gap-5">
          <Card className="ipad:p-6 ipad-landscape:p-7">
            <SectionHeading
              title="Dónde poner tu QR"
              description="Tres ideas rápidas para que tus clientes lo encuentren."
              titleClassName="text-lg ipad:text-xl"
            />
            <ul className="mt-4 grid gap-3 ipad-landscape:grid-cols-3">
              {USAGE_IDEAS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="group rounded-md border border-ink-100 bg-[var(--brand-surface)] p-4 transition-colors hover:border-mostaza-300 hover:bg-mostaza-50"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-md bg-mostaza-50 text-mostaza-700 transition-colors group-hover:bg-white">
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">{body}</p>
                </li>
              ))}
            </ul>
          </Card>

          <QrMaterials
            qrImageUrl={qrImageUrl}
            tenantName={tenant.name}
            menuUrl={menuUrl}
            tenantSlug={tenant.slug}
            primaryColor={tenant.primaryColor}
            logoUrl={tenant.logoUrl}
            logoShape={tenant.logoShape}
            tenantId={tenantId}
          />
        </div>
      </div>
    </main>
  );
}

function QrPageLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
      <div className="grid gap-5 ipad-landscape:grid-cols-[minmax(440px,520px)_minmax(0,1fr)] ipad-landscape:items-start ipad-landscape:gap-7">
        <Card className="flex flex-col items-center gap-5 ipad:p-7 ipad-landscape:p-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-[420px] w-full rounded-xl ipad:h-[480px] ipad-landscape:h-[540px]" />
          <div className="grid w-full gap-3 ipad:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="space-y-3 ipad:p-6">
            <Skeleton className="h-4 w-40" />
            <div className="grid gap-3 ipad-landscape:grid-cols-3">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
