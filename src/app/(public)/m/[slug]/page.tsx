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

        {/* MOCK: cover image — no field on Tenant. See CLAUDE.md note */}
        <header className="relative border-b border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-sm">
          <div
            className="relative h-40 w-full overflow-hidden ipad:h-56 desktop:h-64"
            style={{ backgroundColor: 'var(--brand-primary-faint)' }}
          >
            {/* MOCK: tenant.coverImageUrl not in schema. Falls back to gradient. */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--brand-primary-faint) 0%, var(--brand-card-strong) 100%)',
              }}
            />
            <div className="absolute right-3 top-3 ipad:right-4 ipad:top-4">
              <Suspense fallback={null}>
                <PublicMenuLanguageSwitcher
                  activeLocale={locale}
                  ariaLabel={t('language.label')}
                />
              </Suspense>
            </div>
          </div>

          <div className="relative px-4 pb-5 pt-0 ipad:px-8 ipad:pb-6">
            <div className="flex flex-col items-center gap-3 ipad:flex-row ipad:items-end ipad:gap-5">
              <div className="-mt-12 shrink-0 ipad:-mt-16">
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    width={128}
                    height={128}
                    priority
                    fetchPriority="high"
                    className="h-24 w-24 rounded-full border-4 border-[var(--brand-card)] object-cover shadow-md ipad:h-32 ipad:w-32"
                  />
                ) : (
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[var(--brand-card)] text-3xl shadow-md ipad:h-32 ipad:w-32 ipad:text-4xl"
                    style={{ backgroundColor: 'var(--brand-primary-faint)' }}
                  >
                    🍽️
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col items-center gap-2 text-center ipad:flex-1 ipad:items-start ipad:text-left">
                <h1 className="fudi-h1 font-heading text-ink-900">{tenant.name}</h1>
                {tenant.cuisineType && (
                  <p className="text-sm capitalize text-ink-500 ipad:max-w-prose">
                    {tenant.cuisineType}
                  </p>
                )}
              </div>

              <div className="flex w-full items-center justify-center ipad:w-auto ipad:justify-end">
                {tenant.whatsappPhone && (
                  <details className="group relative">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md bg-[var(--brand-accent)] px-3 py-2 text-sm font-semibold text-[var(--brand-accent-on)] shadow-sm hover:opacity-90 [&::-webkit-details-marker]:hidden">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                      </svg>
                      {tenant.whatsappPhone}
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </summary>
                    <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-md border border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-lg">
                      <a
                        href={`tel:${tenant.whatsappPhone}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink-900 hover:bg-[var(--brand-primary-faint)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
                        </svg>
                        Llamar
                      </a>
                      <a
                        href={`sms:${tenant.whatsappPhone}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink-900 hover:bg-[var(--brand-primary-faint)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                        </svg>
                        Mensaje SMS
                      </a>
                      <a
                        href={`https://wa.me/${tenant.whatsappPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink-900 hover:bg-[var(--brand-primary-faint)]"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M20.52 3.48A11.94 11.94 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.08.55 4.1 1.6 5.88L0 24l6.45-1.69a11.83 11.83 0 0 0 5.58 1.42h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.36-8.41ZM12.04 21.5h-.01a9.66 9.66 0 0 1-4.93-1.35l-.35-.21-3.83 1 1.02-3.73-.23-.38a9.65 9.65 0 0 1-1.48-5.15c0-5.34 4.35-9.69 9.7-9.69 2.59 0 5.02 1.01 6.85 2.85a9.62 9.62 0 0 1 2.84 6.85c0 5.34-4.34 9.81-9.58 9.81Z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
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
