import { cache, Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildBrandThemeStyle, resolveBrandSurfaceColor } from '@/lib/brand-theme';
import { buildPublicMenuGroups } from '@/lib/public-menu-groups';
import { localizeMenuItems } from '@/lib/menu-i18n';
import { buildMenuJsonLd, buildMenuMetadata, getSiteUrl } from '@/lib/menu-seo';
import { menuService } from '@/server/services/menu.service';
import { getPrisma } from '@/lib/db/prisma';
import { PublicMenuLanguageSwitcher, PublicMenuPwaWrapper } from './public-menu-pwa-wrapper';
import { PublicMenuIsland, type IslandStrings } from './public-menu-island';
import { PublicMenuStickyNav, type NavAnchor } from './public-menu-sticky-nav';
import { PublicPhoneDisclosure } from './public-phone-disclosure';
import type { Metadata } from 'next';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

// Prisma requires Node.js runtime — Edge is incompatible.
export const runtime = 'nodejs';
export const revalidate = 60;
const getTenantBySlug = cache((slug: string) => menuService.getCachedTenantBySlug(slug));

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: 'es' | 'en' }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [t, locale, tenant] = await Promise.all([
    getTranslations('menu'),
    getLocale(),
    getTenantBySlug(slug),
  ]);
  if (!tenant) return { title: t('metadata.notFoundTitle') };
  return buildMenuMetadata({
    tenant,
    title: t('metadata.title', { restaurant: tenant.name }),
    description: t('metadata.description', { restaurant: tenant.name }),
    locale: locale === 'en' ? 'en' : 'es',
    baseUrl: getSiteUrl(),
  });
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('52') ? digits.slice(2) : digits;
  if (local.length === 10) return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
  return local;
}

function getLogoFrameClass(shape: Tenant['logoShape']) {
  if (shape === 'rectangular') {
    return 'h-20 w-36 rounded-lg ipad:h-24 ipad:w-44';
  }

  if (shape === 'square') {
    return 'h-24 w-24 rounded-lg ipad:h-32 ipad:w-32';
  }

  return 'h-24 w-24 rounded-full ipad:h-32 ipad:w-32';
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

  const brandThemeStyle = buildBrandThemeStyle(tenant.primaryColor);
  const { dailySpecials, groups } = buildPublicMenuGroups({
    sections,
    categories,
    items,
    otherCategoryName: t('otherCategory'),
    resolveSectionAccent: resolveBrandSurfaceColor,
  });
  const hasSections = sections.length > 0;

  const menuJsonLd = buildMenuJsonLd({
    tenant,
    groups,
    dailySpecials,
    locale,
    baseUrl: getSiteUrl(),
    dailySpecialsLabel: t('dailySpecials'),
    menuName: t('metadata.menuName'),
  });

  const logoFrameClass = getLogoFrameClass(tenant.logoShape);
  const logoObjectClass = 'object-cover';

  const sectionAnchors: NavAnchor[] = [];
  if (hasSections) {
    const anchorsBySectionId = new Map<string, NavAnchor>();
    for (const group of groups) {
      if (!group.sectionId) continue;
      anchorsBySectionId.set(group.sectionId, {
        id: `sec-${group.sectionId}`,
        label: group.sectionName!,
      });
    }
    sectionAnchors.push(...anchorsBySectionId.values());
  } else {
    for (const group of groups) {
      sectionAnchors.push({ id: `cat-${group.categoryId}`, label: group.categoryName });
    }
  }

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
    allergenDisclaimer: t('allergenDisclaimer'),
    containsAllergens: t('containsAllergens'),
    badges: {
      dietary: {
        vegan: t('dietary.vegan'),
        vegetarian: t('dietary.vegetarian'),
        gluten_free: t('dietary.gluten_free'),
        spicy: t('dietary.spicy'),
      },
      allergen: {
        dairy: t('allergen.dairy'),
        nuts: t('allergen.nuts'),
        peanuts: t('allergen.peanuts'),
        gluten: t('allergen.gluten'),
        shellfish: t('allergen.shellfish'),
        fish: t('allergen.fish'),
        eggs: t('allergen.eggs'),
        soy: t('allergen.soy'),
        sesame: t('allergen.sesame'),
      },
    },
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
        <script
          type="application/ld+json"
          // schema.org Restaurant/Menu/MenuItem — discovery only, no PII beyond
          // the public business phone the tenant already shows on the page.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
        />
        <a
          href="#menu-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--brand-card)] focus:px-4 focus:py-3 focus:font-bold focus:text-ink-900"
        >
          {t('skipToMenu')}
        </a>

        <header className="relative border-b border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-sm">
          <div
            className="relative h-40 w-full overflow-hidden ipad:h-56 desktop:h-64"
            style={{ backgroundColor: 'var(--brand-primary-faint)' }}
          >
            {tenant.coverImageUrl ? (
              <>
                <Image
                  src={tenant.coverImageUrl}
                  alt=""
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1180px) 1180px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent" />
              </>
            ) : (
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, var(--brand-primary-faint) 0%, var(--brand-card-strong) 100%)',
                }}
              />
            )}
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
                    width={tenant.logoShape === 'rectangular' ? 176 : 128}
                    height={128}
                    priority
                    fetchPriority="high"
                    className={`${logoFrameClass} border-4 border-[var(--brand-card)] bg-[var(--brand-card)] ${logoObjectClass} shadow-md`}
                  />
                ) : (
                  <div
                    className={`flex ${logoFrameClass} items-center justify-center border-4 border-[var(--brand-card)] text-3xl shadow-md ipad:text-4xl`}
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
                  <PublicPhoneDisclosure
                    phone={tenant.whatsappPhone}
                    displayPhone={formatPhoneDisplay(tenant.whatsappPhone)}
                    labels={{ call: 'Llamar', sms: 'Mensaje SMS', whatsapp: 'WhatsApp' }}
                  />
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
  const localePromise = getLocale();
  const tenant = await getTenantBySlug(slug);
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
    localePromise,
  ]);

  // Localize after the locale-agnostic menu cache so name/description follow the
  // comensal's language, falling back to the tenant's default locale per field.
  const viewLocale = locale === 'en' ? 'en' : 'es';
  const localizedItems = localizeMenuItems(items, viewLocale, tenant.defaultLocale);

  return (
    <>
      <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      <PublicMenuContent
        slug={slug}
        tenant={tenant}
        sections={sections}
        categories={categories}
        items={localizedItems}
        priceLocale={locale === 'en' ? 'en-US' : 'es-MX'}
        locale={viewLocale}
      />
    </>
  );
}
