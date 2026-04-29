import { Card } from '@/components/ui/card';
import { AppHeader } from '@/components/layout/app-header';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '¿Tan temprano? 💪';
  if (h < 12) return '¡Buen día!';
  if (h < 19) return '¿Ya comió?';
  return '¡Buenas noches!';
}

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const items = await menuService.getItemsByTenantId(ctx.tenantId);
  const total = items.length;
  const agotados = items.filter((i) => !i.isAvailable).length;

  return (
    <>
      <AppHeader title="Inicio" />
      <main className="flex flex-col gap-4 px-4 pb-6">
        <div>
          <p className="text-sm text-ink-500">{greeting()}</p>
          <h2 className="text-2xl font-bold">¡Hola, {ctx.email.split('@')[0]}!</h2>
        </div>

        <Card className="bg-gradient-to-br from-mostaza-50 to-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-500">Vistas hoy 👀</p>
          </div>
          <p className="mt-1 text-4xl font-extrabold tabular-nums">142</p>
          <p className="mt-1 text-sm text-menta-500">▲ +18% vs ayer</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-ink-500">Items totales</p>
            <p className="text-2xl font-bold tabular-nums">{total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-ink-500">Agotados</p>
            <p className="text-2xl font-bold tabular-nums text-coral-500">{agotados}</p>
          </Card>
        </div>

        <Card>
          <p className="text-sm font-medium text-ink-700">Top platillo esta semana</p>
          <p className="mt-1 text-lg font-bold">🌮 Tacos al pastor</p>
          <p className="text-sm text-ink-500">487 vistas</p>
        </Card>
      </main>
    </>
  );
}
