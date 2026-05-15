import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { ProFeatureLock } from '@/components/admin/pro-feature-lock';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/server/guards/require-auth';

export default async function AnalyticsPage() {
  const ctx = await requireAuth();

  return (
    <>
      <AppHeader
        title="Stats"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex flex-col gap-4 px-4">
        {ctx.plan === 'free' ? (
          <Card className="space-y-4 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
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
        <Card className="bg-gradient-to-br from-mostaza-50 to-white">
          <p className="text-sm font-medium text-ink-500">Vistas semana 📈</p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">1,247</p>
          <p className="mt-1 text-sm text-menta-500">▲ +18% vs semana pasada</p>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-medium text-ink-700">Top 5 esta semana</p>
          <ul className="flex flex-col gap-3">
            {[
              { name: 'Tacos al pastor', views: 487 },
              { name: 'Tacos de suadero', views: 312 },
              { name: 'Agua de horchata', views: 198 },
              { name: 'Flan de la casa', views: 145 },
              { name: 'Quesadillas', views: 105 },
            ].map((row, i) => (
              <li key={row.name} className="flex items-center justify-between">
                <span className="font-medium">
                  {i + 1}. {row.name}
                </span>
                <span className="tabular-nums text-ink-500">{row.views}</span>
              </li>
            ))}
          </ul>
        </Card>
          </>
        )}
      </main>
    </>
  );
}
