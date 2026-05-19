import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/server/guards/require-auth';
import { getTenantAnalyticsStats } from '@/server/services/posthog-analytics.service';

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
        {ctx.plan === 'free' ? (
          <Card className="space-y-4 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm ipad:p-6">
            <div>
              <p className="text-sm font-extrabold uppercase text-mostaza-600">✨ Pro</p>
              <h2 className="mt-1 text-xl font-extrabold text-ink-900">
                Analytics desbloquea decisiones
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Ve qué platillos jalan más vistas, qué cambió en la semana y qué conviene
                empujar como especial.
              </p>
            </div>
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
        ) : (
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

            <Card className="ipad:p-6">
              <p className="mb-3 text-sm font-medium text-ink-700">Top 5 esta semana</p>
              {stats && stats.topItems.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {stats.topItems.map((row, i) => (
                    <li key={row.id} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate font-medium">
                        {i + 1}. {row.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-500">
                        {formatCount(row.views)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-ink-600">
                  Todavía no hay vistas de platillos esta semana.
                </p>
              )}
            </Card>
          </>
        )}
      </main>
    </>
  );
}
