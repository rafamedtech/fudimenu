import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { PlanLimitBanner } from '@/components/admin/plan-limit-banner';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { AppHeader } from '@/components/layout/app-header';
import { ItemCard } from '@/components/menu/item-card';
import { Card } from '@/components/ui/card';
import { ItemCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import Link from 'next/link';

type MenuPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const { welcome } = await searchParams;
  const ctx = await requireAuth();
  const showWelcomeBanner = welcome === '1';

  return (
    <>
      <AppHeader
        title="Menú"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4">
        {showWelcomeBanner && (
          <Card className="mb-4 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
            <p className="text-sm font-extrabold text-ink-900">
              Tu menú arrancó con 6 platillos base. Edita nombres, precios o fotos cuando quieras.
            </p>
          </Card>
        )}
        <Suspense fallback={<MenuListLoading />}>
          <MenuList tenantId={ctx.tenantId} />
        </Suspense>
      </main>
    </>
  );
}

async function MenuList({ tenantId }: { tenantId: string }) {
  const { tenant, categories, items } = await menuService.getMenuByTenantId(tenantId);
  const visibleItems = await getVisibleItems(items);
  const categoryNamesById = new Map(categories.map((category) => [category.id, category.name]));

  if (visibleItems.length === 0) {
    return (
      <>
        <EmptyState
          emoji="🍽️"
          title="Tu menú está vacío"
          description="Agrega tu primer platillo, ese que más venden."
          action={
            <Link href="/menu/new">
              <Button size="lg">+ Agregar platillo</Button>
            </Link>
          }
        />
        <PlanLimitBanner plan={tenant.plan} itemCount={visibleItems.length} />
      </>
    );
  }

  return (
    <>
      <PlanLimitBanner plan={tenant.plan} itemCount={visibleItems.length} />
      <ul className="flex flex-col gap-2">
        {visibleItems.map((item) => (
          <li key={item.id}>
            <ItemCard
              item={item}
              categoryName={item.categoryId ? categoryNamesById.get(item.categoryId) : null}
              href={`/menu/${item.id}`}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

async function getVisibleItems(items: Awaited<ReturnType<typeof menuService.getMenuByTenantId>>['items']) {
  if (process.env.USE_MOCKS !== 'true') return items;

  const mockItem = (await cookies()).get('mock_onboarding_item')?.value;
  if (!mockItem) return items;

  try {
    const parsed = JSON.parse(mockItem) as { name?: unknown; priceCents?: unknown };
    if (typeof parsed.name !== 'string' || typeof parsed.priceCents !== 'number') return items;
    const name = parsed.name;
    const priceCents = parsed.priceCents;

    return items.map((item, index) =>
      index === 0
        ? {
            ...item,
            name,
            priceCents,
          }
        : item,
    );
  } catch {
    return items;
  }
}

function MenuListLoading() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i}>
          <ItemCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
