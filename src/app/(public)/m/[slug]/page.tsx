import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildBrandThemeStyle, resolveBrandSurfaceColor } from '@/lib/brand-theme';
import { menuService } from '@/server/services/menu.service';
import { getPrisma } from '@/lib/db/prisma';
import { PublicMenuLanguageSwitcher, PublicMenuPwaWrapper } from './public-menu-pwa-wrapper';
import {
  PublicMenuIsland,
  type IslandGroup,
  type IslandStrings,
} from './public-menu-island';
import { PublicMenuStickyNav, type NavAnchor } from './public-menu-sticky-nav';
import type { Metadata } from 'next';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

// Prisma requires Node.js runtime — Edge is incompatible.
export const runtime = 'nodejs';
export const revalidate = 60;
const OTHER_CATEGORY_NAME = 'Otros';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: 'es' | 'en' }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('menu');
  const tenant = await menuService.getCachedTenantBySlug(slug);
  if (!tenant) return { title: t('metadata.notFoundTitle') };
  return {
    title: t('metadata.title', { restaurant: tenant.name }),
    description: t('metadata.description', { restaurant: tenant.name }),
  };
}

async function PublicMenuContent({
  slug,
  tenant,
  sections,
  categories,
  items,
  priceLocale,
  locale,
}: {
  slug: string;
  tenant: Tenant;
  sections: MenuSection[];
  categories: Category[];
  items: MenuItem[];
  priceLocale: string;
  locale: 'es' | 'en';
}) {
  const t = await getTranslations('menu');

  const dailySpecials = items.filter((item) => item.isSpecialToday);
  const regularItems = items.filter((item) => !item.isSpecialToday);
  const brandThemeStyle = buildBrandThemeStyle(tenant.primaryColor);

  const hasSections = sections.length > 0;

  const groups: IslandGroup[] = [];

  if (hasSections) {
    for (const section of sections.filter((s) => s.isVisible)) {
      for (const category of categories.filter((c) => c.sectionId === section.id && c.isVisible)) {
        const groupItems = regularItems.filter((i) => i.categoryId === category.id);
        if (groupItems.length === 0) continue;
        groups.push({
          sectionId: section.id,
          sectionName: section.name,
          sectionAccent: resolveBrandSurfaceColor(section.accentColor),
          categoryId: category.id,
          categoryName: category.name,
          items: groupItems,
        });
      }
    }
  } else {
    const uncategorized = regularItems.filter((i) => i.categoryId === null);
    const otherCategory = categories.find(
      (c) => c.name.trim().toLocaleLowerCase() === OTHER_CATEGORY_NAME.toLocaleLowerCase(),
    );
    for (const category of categories.filter((c) => c.isVisible)) {
      const catItems = regularItems.filter((i) => i.categoryId === category.id);
      const merged =
        otherCategory && category.id === otherCategory.id
          ? [...catItems, ...uncategorized]
          : catItems;
      if (merged.length === 0) continue;
      groups.push({
        sectionId: null,
        sectionName: null,
        sectionAccent: null,
        categoryId: category.id,
        categoryName: category.name,
        items: merged,
      });
    }
    if (!otherCategory && uncategorized.length > 0) {
      groups.push({
        sectionId: null,
        sectionName: null,
        sectionAccent: null,
        categoryId: 'uncategorized',
        categoryName: t('otherCategory'),
        items: uncategorized,
      });
    }
  }

  const sectionAnchors: NavAnchor[] = hasSections
    ? Array.from(
        new Map(
          groups
            .filter((g) => g.sectionId)
            .map((g) => [g.sectionId!, { id: `sec-${g.sectionId}`, label: g.sectionName! }]),
        ).values(),
      )
    : groups.map((g) => ({ id: `cat-${g.categoryId}`, label: g.categoryName }));

  const navAnchors: NavAnchor[] = [
    ...(dailySpecials.length > 0
      ? [{ id: 'especiales-hoy', label: t('dailySpecials'), variant: 'special' as const }]
      : []),
    ...sectionAnchors,
  ];

  const islandStrings: IslandStrings = {
    searchPlaceholder: t('searchPlaceholder'),
    searchAria: t('searchAria'),
    searchClear: t('searchClear'),
    searchEmpty: t('searchEmpty'),
    closeSheet: t('closeSheet'),
    sectionLabel: t('sectionLabel'),
    special: t('special'),
    soldOut: t('soldOut'),
    orderWhatsApp: t('orderWhatsApp'),
    viewDetail: t('viewDetail'),
    dailySpecials: t('dailySpecials'),
    otherCategory: t('otherCategory'),
  };

  return (
    <PublicMenuPwaWrapper
      slug={slug}
      tenantId={tenant.id}
      locale={locale}
      brandThemeStyle={brandThemeStyle}
      pwaStrings={{
        prompt: t('pwaPrompt'),
        install: t('pwaInstall'),
        close: t('pwaClose'),
      }}
    >
      <main
        className="mx-auto min-h-dvh w-full max-w-md scroll-smooth bg-[var(--brand-surface)] pb-12 ipad:max-w-[744px] ipad:pb-16 ipad-landscape:max-w-[984px] desktop:max-w-[1180px] desktop:border-x desktop:border-[var(--brand-card-border)]"
        style={brandThemeStyle}
      >
        <a
          href="#menu-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--brand-card)] focus:px-4 focus:py-3 focus:font-bold focus:text-ink-900"
        >
          {t('skipToMenu')}
        </a>

        <header className="relative border-b border-[var(--brand-card-border)] bg-[var(--brand-card)] px-6 py-8 text-center shadow-sm ipad:px-10 ipad:py-10 ipad-landscape:py-12">
          <div className="absolute right-4 top-4">
            <Suspense fallback={null}>
              <PublicMenuLanguageSwitcher
                activeLocale={locale}
                ariaLabel={t('language.label')}
              />
            </Suspense>
          </div>
          {tenant.logoUrl ? (
            <Image
              src={tenant.logoUrl}
              alt={tenant.name}
              width={96}
              height={96}
              priority
              fetchPriority="high"
              className="mx-auto mb-3 h-20 w-20 rounded-full object-cover ipad:h-24 ipad:w-24"
            />
          ) : (
            <div
              className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl ipad:h-24 ipad:w-24 ipad:text-4xl"
              style={{ backgroundColor: 'var(--brand-primary-faint)' }}
            >
              🍽️
            </div>
          )}
          <h1 className="fudi-h1 font-heading text-ink-900">{tenant.name}</h1>
        </header>

        <PublicMenuStickyNav anchors={navAnchors} ariaLabel="Categorías" />

        <PublicMenuIsland
          slug={slug}
          tenantName={tenant.name}
          whatsappPhone={tenant.whatsappPhone ?? null}
          priceLocale={priceLocale}
          locale={locale}
          dailySpecials={dailySpecials}
          groups={groups}
          strings={islandStrings}
        />

        {tenant.plan === 'free' && (
          <footer className="mt-8 px-4 text-center text-xs text-ink-500 ipad:mt-12">
            {t('madeWith')}{' '}
            <Link href="/" className="font-bold text-[var(--brand-accent-text)] hover:underline">
              FudiMenu
            </Link>
          </footer>
        )}
      </main>
    </PublicMenuPwaWrapper>
  );
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await menuService.getCachedTenantBySlug(slug);
  if (!tenant) {
    const history =
      process.env.USE_MOCKS === 'true'
        ? null
        : await getPrisma().slugHistory.findUnique({
            where: { slug },
            select: {
              createdAt: true,
              deletedAt: true,
              tenant: { select: { slug: true, deletedAt: true } },
            },
          });

    if (
      history &&
      !history.deletedAt &&
      !history.tenant.deletedAt &&
      Date.now() - history.createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000
    ) {
      permanentRedirect(`/m/${history.tenant.slug}`);
    }

    notFound();
  }

  const [{ sections, categories, items }, locale] = await Promise.all([
    menuService.getCachedMenuByTenantId(tenant.id),
    getLocale(),
  ]);

  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <PublicMenuContent
        slug={slug}
        tenant={tenant}
        sections={sections}
        categories={categories}
        items={items}
        priceLocale={locale === 'en' ? 'en-US' : 'es-MX'}
        locale={locale === 'en' ? 'en' : 'es'}
      />
    </>
  );
}
