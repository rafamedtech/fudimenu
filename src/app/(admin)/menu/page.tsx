import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { ExternalLink } from 'lucide-react';
import { PlanLimitBanner } from '@/components/admin/plan-limit-banner';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { SectionGrid } from '@/components/admin/section-grid';
import { WelcomeBanner } from '@/components/admin/welcome-banner';
import { AppHeader } from '@/components/layout/app-header';
import { ItemCard } from '@/components/menu/item-card';
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
      <main className="flex-1 px-4 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        {showWelcomeBanner && <WelcomeBanner />}
        <Suspense fallback={<MenuListLoading />}>
          <MenuList tenantId={ctx.tenantId} />
        </Suspense>
      </main>
    </>
  );
}

async function MenuList({ tenantId }: { tenantId: string }) {
  const { tenant, sections, categories, items } = await menuService.getCachedMenuByTenantId(tenantId);
  const visibleItems = await getVisibleItems(items);
  const categoryNamesById = new Map(categories.map((category) => [category.id, category.name]));
  const sectionIdByCategoryId = new Map(categories.map((c) => [c.id, c.sectionId]));
  const itemCountBySectionId: Record<string, number> = {};
  for (const item of visibleItems) {
    if (!item.categoryId) continue;
    const sectionId = sectionIdByCategoryId.get(item.categoryId);
    if (!sectionId) continue;
    itemCountBySectionId[sectionId] = (itemCountBySectionId[sectionId] ?? 0) + 1;
  }
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

      <div className="mb-3 flex justify-end ipad:mb-4">
        <Link
          href={`/m/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-primary-border)] bg-[var(--brand-card)] px-3 py-2 text-sm font-bold text-ink-900 shadow-sm transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] ipad:px-4"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Ver menú público
        </Link>
      </div>

      {hasSections && (
        <SectionGrid
          sections={sections}
          canCreateSection={canCreateSection}
          itemCountBySectionId={itemCountBySectionId}
        />
      )}

      {!hasSections && hasItems && (
        <ul className="mt-4 grid gap-2 ipad:grid-cols-2 ipad:gap-3 ipad-landscape:grid-cols-3 ipad-landscape:gap-4 desktop:grid-cols-4">
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

async function getVisibleItems(items: Awaited<ReturnType<typeof menuService.getCachedMenuByTenantId>>['items']) {
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
    <ul className="grid grid-cols-2 gap-3 ipad:grid-cols-3 ipad:gap-4 ipad-landscape:grid-cols-3 ipad-landscape:gap-5 desktop:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-lg bg-ink-100" />
        </li>
      ))}
    </ul>
  );
}
