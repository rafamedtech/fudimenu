import { Card } from '@/components/ui/card';
import { ProFeatureLock, ProBadge } from '@/components/admin/pro-feature-lock';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Doodle } from '@/components/brand/doodles';
import { AppHeader } from '@/components/layout/app-header';
import { formatPrice } from '@/lib/utils';
import { removeItemSpecialTodayFormAction } from '@/server/actions/items.actions';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import { getTenantAnalyticsStats } from '@/server/services/posthog-analytics.service';
import type { MenuItem } from '@/types/domain';
import Link from 'next/link';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '¿Tan temprano? 💪';
  if (h < 12) return '¡Buen día!';
  if (h < 19) return '¿Ya comió?';
  return '¡Buenas noches!';
}

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

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const [{ items, categories, sections }, analyticsStats] = await Promise.all([
    menuService.getMenuByTenantId(ctx.tenantId),
    ctx.plan === 'free' ? Promise.resolve(null) : getTenantAnalyticsStats(ctx.tenantId),
  ]);
  const dailySpecial = findDailySpecial(items);
  const total = items.length;
  const agotados = items.filter((i) => !i.isAvailable).length;
  const topItem = analyticsStats?.topItems[0] ?? null;
  const activeSlug = ctx.memberships.find((m) => m.tenantId === ctx.tenantId)?.tenant.slug ?? '#';

  return (
    <>
      <AppHeader
        title="Inicio"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-4 px-4 pb-6 ipad:gap-5 ipad:px-6 ipad:pb-8 ipad-landscape:px-7 desktop:px-8">
        <div className="relative overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-5 shadow-md ipad:p-7 ipad-landscape:min-h-48">
          <div className="relative z-10 max-w-[68%] ipad:max-w-[58%]">
            <p className="text-sm font-bold text-[var(--brand-accent-text)]">{greeting()}</p>
            <h2 className="fudi-h1 mt-1">¡Hola, {ctx.email.split('@')[0]}!</h2>
            <p className="mt-3 text-sm leading-6 text-ink-500 ipad:text-base">
              Tu menú ya vive online. Toca para activar, editar o compartir.
            </p>
          </div>
          <Doodle name="chef" className="absolute -right-8 bottom-0 h-40 w-48 ipad:right-2 ipad:h-56 ipad:w-64" />
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

        <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-5 ipad-landscape:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-500">Especial de hoy</p>
              {dailySpecial ? (
                <>
                  <h3 className="mt-1 text-xl font-extrabold text-ink-900">
                    {dailySpecial.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-ink-700">
                    {formatPrice(
                      dailySpecial.specialPrice ?? dailySpecial.priceCents,
                      dailySpecial.currency,
                    )}
                  </p>
                </>
              ) : (
                <h3 className="mt-1 text-lg font-extrabold text-ink-900">
                  ¿Qué hay de especial hoy? 👨‍🍳
                </h3>
              )}
            </div>

            {dailySpecial ? (
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/menu/${dailySpecial.id}`}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-md border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-4 text-sm font-semibold text-ink-900 transition-all duration-150 active:scale-[0.97] sm:flex-none"
                >
                  Cambiar
                </Link>
                <form action={removeItemSpecialTodayFormAction} className="flex-1 sm:flex-none">
                  <input type="hidden" name="itemId" value={dailySpecial.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink-900 px-4 text-sm font-semibold text-white transition-all duration-150 active:scale-[0.97]"
                  >
                    Quitar
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/menu/new"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--brand-on-primary)] shadow-md transition-all duration-150 active:scale-[0.97]"
              >
                + Agregar
              </Link>
            )}
          </div>
        </Card>

        <div className="grid gap-3 ipad:grid-cols-3 ipad:gap-4">
          <Link href="/qr" className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 font-black shadow-md hover:border-[var(--brand-primary-border)]">Compartir QR</Link>
          <Link href="/menu" className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 font-black shadow-md hover:border-[var(--brand-primary-border)]">Editar menú</Link>
          <Link href={`/m/${activeSlug}`} target="_blank" className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 font-black shadow-md hover:border-[var(--brand-primary-border)]">Ver mi menú público</Link>
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
