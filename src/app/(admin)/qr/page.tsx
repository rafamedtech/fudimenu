import { Suspense } from 'react';
import Image from 'next/image';
import { Printer, Smartphone, Sticker, Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Doodle } from '@/components/brand/doodles';
import { Card } from '@/components/ui/card';
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
      <div className="grid gap-5 ipad-landscape:grid-cols-[minmax(0,1fr)_minmax(440px,520px)] ipad-landscape:items-start ipad-landscape:gap-7">
        {/* LEFT: pitch + ideas */}
        <div className="flex flex-col gap-5">
          <Card className="relative overflow-hidden border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-7 ipad-landscape:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-mostaza-500/15 blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-12 size-48 rounded-full bg-coral-500/10 blur-2xl"
            />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mostaza-500/40 bg-white/70 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-mostaza-700">
                <Sparkles size={12} />
                Tu menú, en un escaneo
              </span>
              <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-ink-900 ipad:text-4xl ipad-landscape:text-5xl">
                {tenant.name}
              </h1>
              <p className="mt-2 max-w-md text-sm text-ink-700 ipad:text-base">
                Pega esto donde sea. Funciona siempre, se actualiza solo cada vez que editas el menú.
              </p>

              <div className="mt-6 flex justify-center ipad-landscape:justify-start">
                <Doodle
                  name="qr-phone"
                  className="h-44 w-56 ipad:h-52 ipad:w-72 ipad-landscape:h-56 ipad-landscape:w-80"
                />
              </div>
            </div>
          </Card>

          <Card className="ipad:p-6 ipad-landscape:p-7">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                Cómo usarlo
              </p>
              <span className="text-[11px] font-semibold text-ink-300">3 ideas rápidas</span>
            </div>
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

        {/* RIGHT: sticky QR panel */}
        <div className="ipad-landscape:sticky ipad-landscape:top-24">
          <Card className="flex flex-col items-center gap-5 ipad:p-7 ipad-landscape:p-8">
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                  Tu código QR
                </p>
                <p className="text-xs text-ink-500">Alta resolución, listo para imprimir</p>
              </div>
              <span className="rounded-full bg-menta-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-menta-600">
                Activo
              </span>
            </div>

            <div className="relative rounded-xl bg-gradient-to-br from-mostaza-50 via-white to-crema-100 p-3 shadow-md ipad-landscape:p-4">
              <div className="relative h-[280px] w-[280px] overflow-hidden rounded-lg border-[1.5px] border-dashed border-mostaza-300 bg-white ipad:h-[340px] ipad:w-[340px] ipad-landscape:h-[400px] ipad-landscape:w-[400px]">
                <Image
                  src={qrImagePath}
                  alt={`QR del menú de ${tenant.name}`}
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 768px) 340px, 280px"
                  priority
                  unoptimized
                  className="object-contain p-4"
                />
              </div>
              {/* corner anchors */}
              <span aria-hidden className="absolute -left-1 -top-1 size-3 rounded-tl-md border-l border-t border-mostaza-500" />
              <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-tr-md border-r border-t border-mostaza-500" />
              <span aria-hidden className="absolute -bottom-1 -left-1 size-3 rounded-bl-md border-b border-l border-mostaza-500" />
              <span aria-hidden className="absolute -bottom-1 -right-1 size-3 rounded-br-md border-b border-r border-mostaza-500" />
            </div>

            <div className="w-full rounded-md bg-[var(--brand-surface-strong)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                Link del menú
              </p>
              <p className="mt-1.5 break-all font-mono text-sm font-bold text-ink-900">
                {menuUrl}
              </p>
            </div>

            <QrShareActions
              menuUrl={menuUrl}
              qrImageUrl={qrImageUrl}
              downloadUrl={`${qrImageUrl}?download=1`}
              tenantId={tenantId}
            />
          </Card>
        </div>
      </div>
    </main>
  );
}

function QrPageLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
      <div className="grid gap-5 ipad-landscape:grid-cols-[minmax(0,1fr)_minmax(440px,520px)] ipad-landscape:items-start ipad-landscape:gap-7">
        <div className="flex flex-col gap-5">
          <Card className="space-y-4 overflow-hidden border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-7">
            <Skeleton className="h-5 w-56 max-w-full rounded-full" />
            <Skeleton className="h-10 w-64 max-w-full" />
            <Skeleton className="h-4 w-72 max-w-full" />
            <Skeleton className="mx-auto mt-2 h-44 w-56 ipad:h-52 ipad:w-72" />
          </Card>
          <Card className="space-y-3 ipad:p-6">
            <Skeleton className="h-4 w-40" />
            <div className="grid gap-3 ipad-landscape:grid-cols-3">
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
          </Card>
        </div>
        <Card className="flex flex-col items-center gap-5 ipad:p-7 ipad-landscape:p-8">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-[280px] w-[280px] rounded-lg ipad:h-[340px] ipad:w-[340px] ipad-landscape:h-[400px] ipad-landscape:w-[400px]" />
          <Skeleton className="h-16 w-full rounded-md" />
          <div className="grid w-full gap-3 ipad:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </Card>
      </div>
    </main>
  );
}
