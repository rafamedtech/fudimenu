import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
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
      </main>
    </>
  );
}
