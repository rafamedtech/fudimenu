import { Card } from '@/components/ui/card';
import { ProFeatureLock, ProBadge } from '@/components/admin/pro-feature-lock';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Doodle } from '@/components/brand/doodles';
import { AppHeader } from '@/components/layout/app-header';
import { formatPrice } from '@/lib/utils';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { getTenantAnalyticsStats } from '@/server/services/posthog-analytics.service';
import type { MenuItem } from '@/types/domain';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function findDailySpecial(items: MenuItem[]) {
  return items.find((item) => item.isAvailable && item.isSpecialToday) ?? null;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('es-MX').format(value);
}

function formatDelta(value: number | null, period: 'ayer' | 'semana pasada') {
  if (value === null) return `Sin comparativo vs ${period}`;
  return `${value >= 0 ? '▲' : '▼'} ${value >= 0 ? '+' : ''}${value}% vs ${period}`;
}

function ActionCard({
  href,
  title,
  description,
  doodle,
  target,
}: {
  href: string;
  title: string;
  description: string;
  doodle: React.ComponentProps<typeof Doodle>['name'];
  target?: '_blank';
}) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className="group relative min-h-44 overflow-hidden rounded-2xl border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md transition-all hover:-translate-y-0.5 hover:border-[var(--brand-primary-border)] hover:shadow-lg active:scale-[0.99] ipad:min-h-52 ipad:p-6"
    >
      <div className="relative z-10 max-w-[72%]">
        <p className="font-heading text-xl font-black text-ink-900 ipad:text-2xl">{title}</p>
        <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
      </div>
      <Doodle
        name={doodle}
        className="absolute -bottom-6 -right-10 h-36 w-44 opacity-95 transition-transform group-hover:scale-105 ipad:-bottom-8 ipad:-right-12 ipad:h-44 ipad:w-56"
      />
    </Link>
  );
}

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const [{ tenant, items, categories, sections }, analyticsStats] = await Promise.all([
    menuService.getMenuByTenantId(ctx.tenantId),
    ctx.plan === 'free' ? Promise.resolve(null) : getTenantAnalyticsStats(ctx.tenantId),
  ]);
  const dailySpecial = findDailySpecial(items);
  const total = items.length;
  const agotados = items.filter((i) => !i.isAvailable).length;
  const topItem = analyticsStats?.topItems[0] ?? null;
  const activeSlug = tenant.slug;

  return (
    <>
      <AppHeader
        title="Inicio"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-4 px-4 pb-6 ipad:gap-5 ipad:px-6 ipad:pb-8 ipad-landscape:px-7 desktop:px-8">
        <div className="relative overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md ipad:p-7">
          <div className="flex items-center gap-5 ipad:gap-7">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] shadow-sm ipad:h-32 ipad:w-32">
              {tenant.logoUrl ? (
                <Image
                  src={tenant.logoUrl}
                  alt={`Logo de ${tenant.name}`}
                  fill
                  sizes="(min-width: 768px) 128px, 96px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-500">
                  <ImageIcon className="h-8 w-8 ipad:h-10 ipad:w-10" aria-hidden="true" />
                  <span className="px-2 text-center text-[10px] font-bold uppercase tracking-wider">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <h2 className="font-heading text-3xl font-black leading-tight text-ink-900 ipad:text-5xl ipad-landscape:text-6xl">
              Bienvenido a <span className="text-[var(--brand-primary)]">{tenant.name}</span>
            </h2>
          </div>
        </div>

        {ctx.plan === 'free' ? (
          <ProFeatureLock
            title="Analytics es Pro"
            description="Desbloquea vistas del día, tendencias semanales y top platillos para saber qué se está moviendo."
            className="block"
          >
            <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-500">Vistas hoy</p>
                <ProBadge />
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Toca para activar analytics y ver qué platillos están ganando atención.
              </p>
            </Card>
          </ProFeatureLock>
        ) : (
          <div className="grid gap-3 ipad:grid-cols-2 ipad:gap-4">
            <Card className="bg-gradient-to-br from-mostaza-50 to-[var(--brand-card)] ipad:p-5 ipad-landscape:p-6">
              <p className="text-sm font-medium text-ink-500">Vistas hoy</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums">
                {formatCount(analyticsStats?.todayViews ?? 0)}
              </p>
              <p
                className={`mt-1 text-sm ${
                  (analyticsStats?.todayDeltaPercent ?? 0) >= 0 ? 'text-menta-500' : 'text-coral-500'
                }`}
              >
                {analyticsStats?.status === 'missing_config'
                  ? 'PostHog no configurado'
                  : analyticsStats?.status === 'error'
                    ? 'No pudimos leer PostHog'
                    : formatDelta(analyticsStats?.todayDeltaPercent ?? null, 'ayer')}
              </p>
            </Card>
            <Card className="ipad:p-5">
              <p className="text-sm font-medium text-ink-700">Top platillo esta semana</p>
              {topItem ? (
                <>
                  <p className="mt-1 truncate text-lg font-bold">{topItem.name}</p>
                  <p className="text-sm text-ink-500">{formatCount(topItem.views)} vistas</p>
                </>
              ) : (
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  Todavía no hay vistas de platillos esta semana.
                </p>
              )}
            </Card>
          </div>
        )}

        <div className="grid gap-3 ipad:grid-cols-3 ipad:gap-4">
          <ActionCard
            href="/qr"
            title="Compartir QR"
            description="Descarga, imprime o manda el QR de tu menú."
            doodle="qr-phone"
          />
          <ActionCard
            href={`/m/${activeSlug}`}
            target="_blank"
            title="Ver mi menú público"
            description="Abre la vista que ven tus clientes al escanear."
            doodle="hero"
          />
          <ActionCard
            href={dailySpecial ? `/menu/${dailySpecial.id}` : '/menu'}
            title="Especial de hoy"
            description={
              dailySpecial
                ? `${dailySpecial.name} · ${formatPrice(
                    dailySpecial.specialPrice ?? dailySpecial.priceCents,
                    dailySpecial.currency,
                  )}`
                : 'Elige el platillo que quieres empujar hoy.'
            }
            doodle="chef"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 ipad:gap-4 ipad-landscape:grid-cols-4">
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Items totales</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{total}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Agotados</p>
            <p className="text-2xl font-bold tabular-nums text-coral-500 ipad:text-3xl">{agotados}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Categorías</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{categories.length}</p>
          </Card>
          <Card className="p-4 ipad:p-5">
            <p className="text-xs text-ink-500">Secciones</p>
            <p className="text-2xl font-bold tabular-nums ipad:text-3xl">{sections.length}</p>
          </Card>
        </div>
      </main>
    </>
  );
}
