import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { ExternalLink, FileUp, Layers3, Plus, Utensils, type LucideIcon } from 'lucide-react';
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

type MockMenuItemOverride = {
  name: string;
  priceCents: number;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const [{ welcome }, ctx, mockItemOverride] = await Promise.all([
    searchParams,
    requireAuth(),
    getMockMenuItemOverride(),
  ]);
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
          <MenuList tenantId={ctx.tenantId} mockItemOverride={mockItemOverride} />
        </Suspense>
      </main>
    </>
  );
}

async function MenuList({
  tenantId,
  mockItemOverride,
}: {
  tenantId: string;
  mockItemOverride: MockMenuItemOverride | null;
}) {
  const { tenant, sections, categories, items } = await menuService.getCachedMenuByTenantId(tenantId);
  const visibleItems = getVisibleItems(items, mockItemOverride);
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
        <PlanLimitBanner
          plan={tenant.plan}
          itemCount={visibleItems.length}
          addHref="/menu/sections/new"
          addLabel="Crear sección"
          showFloatingAction={false}
        />
      </>
    );
  }

  return (
    <>
      <PlanLimitBanner
        plan={tenant.plan}
        itemCount={visibleItems.length}
        sectionCount={sections.length}
        addHref="/menu/sections/new"
        addLabel="Crear sección"
        showFloatingAction={false}
      />

      <MenuOverviewPanel
        publicHref={`/m/${tenant.slug}`}
        sectionCount={sections.length}
        itemCount={visibleItems.length}
        canCreateSection={canCreateSection}
      />

      {hasSections && (
        <SectionGrid
          key={sections.map((section) => `${section.id}:${section.sortOrder}`).join('|')}
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

function MenuOverviewPanel({
  publicHref,
  sectionCount,
  itemCount,
  canCreateSection,
}: {
  publicHref: string;
  sectionCount: number;
  itemCount: number;
  canCreateSection: boolean;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-[var(--brand-card-border)] bg-[rgb(var(--brand-card-rgb)/0.84)] shadow-sm ipad:mb-6">
      <div className="grid gap-0 ipad-landscape:grid-cols-[1fr_auto]">
        <div className="relative px-4 py-4 ipad:min-h-36 ipad:px-6 ipad:py-6">
          <div className="absolute right-4 top-4 hidden size-24 rounded-full bg-[var(--brand-primary-faint)] blur-2xl ipad:block" />
          <div className="relative flex flex-col gap-4 ipad:flex-row ipad:items-center ipad:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--brand-accent-text)]">
                Centro de operaciones
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight text-ink-900 ipad:text-3xl">
                Construye tu carta por bloques
              </h2>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-ink-500 ipad:block">
                Revisa la estructura, abre la vista pública y crea nuevas secciones sin salir del flujo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 ipad:min-w-64">
              <MetricTile icon={Layers3} label="Secciones" value={sectionCount} />
              <MetricTile icon={Utensils} label="Platillos" value={itemCount} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] p-3 ipad:flex ipad:flex-row ipad:p-4 ipad-landscape:w-72 ipad-landscape:flex-col ipad-landscape:border-l ipad-landscape:border-t-0">
          {canCreateSection ? (
            <Link href="/menu/sections/new" className="w-full">
              <Button type="button" className="h-11 w-full justify-center rounded-lg ipad:h-12">
                <Plus className="size-4" aria-hidden />
                Nueva sección
              </Button>
            </Link>
          ) : (
            <Link href="/settings/billing" className="w-full">
              <Button
                type="button"
                className="h-11 w-full justify-center rounded-lg ipad:h-12"
                variant="premium"
              >
                Upgrade para más secciones
              </Button>
            </Link>
          )}
          <Link
            href="/menu/import"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[var(--brand-primary-border)] bg-[var(--brand-card)] px-4 text-sm font-extrabold text-ink-900 shadow-sm transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] focus-visible:outline-none focus-visible:shadow-glow-mostaza ipad:h-12"
          >
            <FileUp className="size-4" aria-hidden />
            Importar CSV
          </Link>
          <Link
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border-[1.5px] border-[var(--brand-primary-border)] bg-[var(--brand-card)] px-4 text-sm font-extrabold text-ink-900 shadow-sm transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] focus-visible:outline-none focus-visible:shadow-glow-mostaza ipad:h-12"
          >
            <ExternalLink className="size-4" aria-hidden />
            Ver menú público
          </Link>
        </div>
      </div>
    </section>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 shadow-sm ipad:p-3">
      <div className="mb-2 flex size-8 items-center justify-center rounded-md bg-[var(--brand-primary-faint)] text-[var(--brand-accent-text)] ipad:size-9">
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="text-xl font-black leading-none text-ink-900 ipad:text-2xl">{value}</p>
      <p className="mt-1 text-xs font-bold text-ink-500">{label}</p>
    </div>
  );
}

async function getMockMenuItemOverride(): Promise<MockMenuItemOverride | null> {
  if (process.env.USE_MOCKS !== 'true') return null;

  const mockItem = (await cookies()).get('mock_onboarding_item')?.value;
  if (!mockItem) return null;

  try {
    const parsed = JSON.parse(mockItem) as { name?: unknown; priceCents?: unknown };
    if (typeof parsed.name !== 'string' || typeof parsed.priceCents !== 'number') return null;
    return { name: parsed.name, priceCents: parsed.priceCents };
  } catch {
    return null;
  }
}

function getVisibleItems(
  items: Awaited<ReturnType<typeof menuService.getCachedMenuByTenantId>>['items'],
  mockItemOverride: MockMenuItemOverride | null,
) {
  if (!mockItemOverride) return items;

  return items.map((item, index) =>
    index === 0
      ? {
          ...item,
          name: mockItemOverride.name,
          priceCents: mockItemOverride.priceCents,
        }
      : item,
  );
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
