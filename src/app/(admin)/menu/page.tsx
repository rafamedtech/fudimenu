import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { PlanLimitBanner } from '@/components/admin/plan-limit-banner';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { SectionGrid } from '@/components/admin/section-grid';
import { AppHeader } from '@/components/layout/app-header';
import { ItemCard } from '@/components/menu/item-card';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { PLAN_CONFIG } from '@/config/plans';
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
  const { tenant, sections, categories, items } = await menuService.getMenuByTenantId(tenantId);
  const visibleItems = await getVisibleItems(items);
  const categoryNamesById = new Map(categories.map((category) => [category.id, category.name]));
  const freeSectionLimit = PLAN_CONFIG.free.limits.sections ?? 5;
  const canCreateSection = tenant.plan !== 'free' || sections.length < freeSectionLimit;

  const hasSections = sections.length > 0;
  const hasItems = visibleItems.length > 0;

  if (!hasSections && !hasItems) {
    return (
      <>
        <EmptyState
          emoji="🍽️"
          title="Tu menú está vacío"
          description="Crea una sección y después agrega platillos dentro."
          action={
            <Link href="/menu/sections/new">
              <Button size="lg">+ Crear primera sección</Button>
            </Link>
          }
        />
        <PlanLimitBanner plan={tenant.plan} itemCount={visibleItems.length} />
      </>
    );
  }

  return (
    <>
      <PlanLimitBanner
        plan={tenant.plan}
        itemCount={visibleItems.length}
        sectionCount={sections.length}
      />

      {hasSections && <SectionGrid sections={sections} canCreateSection={canCreateSection} />}

      {!hasSections && hasItems && (
        <ul className="mt-4 flex flex-col gap-2">
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
      )}
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
    <ul className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-lg bg-ink-100" />
        </li>
      ))}
    </ul>
  );
}
