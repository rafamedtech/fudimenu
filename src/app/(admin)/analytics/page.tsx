import { Suspense } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { Doodle } from '@/components/brand/doodles';
import { Card } from '@/components/ui/card';
import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { requireAuth } from '@/server/guards/require-auth';
import {
  getTenantAnalyticsStats,
  type TenantAnalyticsStats,
} from '@/server/services/posthog-analytics.service';
import type { Plan } from '@/types/domain';

function formatCount(value: number) {
  return new Intl.NumberFormat('es-MX').format(value);
}

function formatDelta(value: number | null) {
  if (value === null) return 'Sin comparativo previo';
  return `${value >= 0 ? '▲' : '▼'} ${value >= 0 ? '+' : ''}${value}% vs semana pasada`;
}

export default async function AnalyticsPage() {
  const ctx = await requireAuth();
  const stats = ctx.plan === 'free' ? null : await getTenantAnalyticsStats(ctx.tenantId);

  return (
    <>
      <AppHeader
        title="Stats"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-4 px-4 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <Suspense fallback={<AnalyticsLoading />}>
          <AnalyticsContent plan={ctx.plan} stats={stats} />
        </Suspense>
      </main>
    </>
  );
}

function AnalyticsContent({ plan, stats }: { plan: Plan; stats: TenantAnalyticsStats | null }) {
  if (plan === 'free') {
    return (
      <Card className="space-y-5 overflow-hidden border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:grid ipad:grid-cols-[1fr_220px] ipad:items-center ipad:p-6">
        <div>
          <p className="text-sm font-extrabold uppercase text-mostaza-600">Pro</p>
          <h2 className="mt-1 text-2xl font-extrabold text-ink-900 ipad:text-3xl">
            Analytics desbloquea decisiones
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Ve qué platillos jalan más vistas, qué cambió en la semana y qué conviene
            empujar como especial.
          </p>
        </div>
        <Doodle name="chart" className="mx-auto h-40 w-52 ipad:order-last" />
        <ProFeatureLock
          title="Analytics es Pro"
          description="Activa Pro para ver vistas, top platillos y señales de demanda de tu menú."
          className="block w-full"
        >
          <span className="flex min-h-12 w-full items-center justify-center rounded-md bg-[var(--brand-primary)] px-5 text-base font-semibold text-[var(--brand-on-primary)] shadow-md transition-all duration-150 active:scale-[0.97]">
            Upgrade
          </span>
        </ProFeatureLock>
      </Card>
    );
  }

  return (
    <>
      {stats?.status === 'missing_config' ? (
        <Card className="border-[1.5px] border-mostaza-500 bg-mostaza-50 ipad:p-5">
          <p className="text-sm font-extrabold text-ink-900">PostHog no configurado</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Agrega POSTHOG_PERSONAL_API_KEY y POSTHOG_PROJECT_ID para cargar stats reales.
          </p>
        </Card>
      ) : null}

      {stats?.status === 'error' ? (
        <Card className="border-[1.5px] border-coral-500 bg-coral-50 ipad:p-5">
          <p className="text-sm font-extrabold text-ink-900">No pudimos leer PostHog</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            Intenta de nuevo en unos minutos. Los eventos siguen capturándose.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 ipad-landscape:grid-cols-2">
        <Card className="bg-gradient-to-br from-mostaza-50 to-[var(--brand-card)] ipad:p-6">
          <p className="text-sm font-medium text-ink-500">Vistas semana</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">
            {formatCount(stats?.weeklyViews ?? 0)}
          </p>
          <p
            className={`mt-1 text-sm ${
              (stats?.weeklyDeltaPercent ?? 0) >= 0 ? 'text-menta-500' : 'text-coral-500'
            }`}
          >
            {formatDelta(stats?.weeklyDeltaPercent ?? null)}
          </p>
        </Card>
        <Card className="bg-[var(--brand-card)] ipad:p-6">
          <p className="text-sm font-medium text-ink-500">Vistas hoy</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">
            {formatCount(stats?.todayViews ?? 0)}
          </p>
          <p
            className={`mt-1 text-sm ${
              (stats?.todayDeltaPercent ?? 0) >= 0 ? 'text-menta-600' : 'text-coral-500'
            }`}
          >
            {stats?.todayDeltaPercent === null || stats?.todayDeltaPercent === undefined
              ? 'Sin comparativo vs ayer'
              : `${stats.todayDeltaPercent >= 0 ? '▲' : '▼'} ${
                  stats.todayDeltaPercent >= 0 ? '+' : ''
                }${stats.todayDeltaPercent}% vs ayer`}
          </p>
        </Card>
      </div>

      <Card className="ipad:p-6">
        <p className="mb-3 text-sm font-medium text-ink-700">Top 5 esta semana</p>
        {stats && stats.topItems.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {stats.topItems.map((row, i) => {
              const max = Math.max(...stats.topItems.map((item) => item.views), 1);
              return (
                <li key={row.id} className="grid gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate font-medium">
                      {i + 1}. {row.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-500">
                      {formatCount(row.views)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-[var(--brand-primary)]"
                      style={{ width: `${Math.max(8, (row.views / max) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-ink-600">
            Todavía no hay vistas de platillos esta semana.
          </p>
        )}
      </Card>
    </>
  );
}

function AnalyticsLoading() {
  return (
    <>
      <div className="grid gap-4 ipad-landscape:grid-cols-2">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <Card className="space-y-3 ipad:p-6">
        <Skeleton className="h-4 w-36" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-48 max-w-[70%]" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </Card>
    </>
  );
}
