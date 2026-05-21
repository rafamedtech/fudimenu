import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { buildBrandThemeStyle, resolveBrandSurfaceColor } from '@/lib/brand-theme';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp';
import { menuService } from '@/server/services/menu.service';
import { getPrisma } from '@/lib/db/prisma';
import { PublicMenuLanguageSwitcher, PublicMenuPwaWrapper } from './public-menu-pwa-wrapper';
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

function getItemPrice(item: MenuItem) {
  return item.isSpecialToday ? item.specialPrice ?? item.priceCents : item.priceCents;
}

function PublicMenuItemCard({
  item,
  categoryName,
  whatsappHref,
  priceLocale,
}: {
  item: MenuItem;
  categoryName: string;
  whatsappHref: string | null;
  priceLocale: string;
}) {
  const t = useTranslations('menu');

  return (
    <article
      className="flex gap-3 rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 shadow-sm ipad:gap-4 ipad:p-4 ipad-landscape:min-h-[156px]"
      data-item-id={item.id}
      data-item-category={categoryName}
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[var(--brand-primary-soft)] ipad:h-24 ipad:w-24 ipad-landscape:h-28 ipad-landscape:w-28">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 112px, (min-width: 768px) 96px, 80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {getCategoryEmoji(categoryName)}
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold uppercase text-white">
            {t('soldOut')}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-ink-900 ipad:text-lg">{item.name}</h3>
          {item.isSpecialToday && (
            <span className="shrink-0 rounded-full bg-coral-500 px-2 py-1 text-[10px] font-extrabold uppercase text-white">
              {t('special')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-ink-500 ipad:mt-1">{item.description}</p>
        )}
        <p className="mt-1 font-bold text-ink-900">
          {formatPrice(getItemPrice(item), item.currency, priceLocale)}
        </p>
        {whatsappHref && item.isAvailable && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track-wa={item.id}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand-primary)] px-3 text-sm font-extrabold text-[var(--brand-on-primary)] shadow-sm transition-all hover:bg-[var(--brand-primary-hover)] active:scale-[0.98] ipad:self-start ipad:px-4"
          >
            {t('orderWhatsApp')}
          </a>
        )}
      </div>
    </article>
  );
}

function PublicMenuContent({
  slug,
  tenant,
  sections,
  categories,
  items,
  priceLocale,
}: {
  slug: string;
  tenant: Tenant;
  sections: MenuSection[];
  categories: Category[];
  items: MenuItem[];
  priceLocale: string;
}) {
  const t = useTranslations('menu');

  const categoryNamesById = new Map(categories.map((c) => [c.id, c.name]));
  const dailySpecials = items.filter((item) => item.isSpecialToday);
  const regularItems = items.filter((item) => !item.isSpecialToday);
  const brandThemeStyle = buildBrandThemeStyle(tenant.primaryColor);

  const hasSections = sections.length > 0;

  // Section → category → items grouping
  const sectionedMenu = hasSections
    ? sections
        .filter((s) => s.isVisible)
        .map((section) => ({
          section,
          groups: categories
            .filter((c) => c.sectionId === section.id && c.isVisible)
            .map((category) => ({
              category,
              items: regularItems.filter((i) => i.categoryId === category.id),
            }))
            .filter(({ items: its }) => its.length > 0),
        }))
        .filter(({ groups }) => groups.length > 0)
    : [];

  // Legacy fallback: flat category grouping (no sections)
  const uncategorizedItems = regularItems.filter((item) => item.categoryId === null);
  const otherCategory = categories.find(
    (c) => c.name.trim().toLocaleLowerCase() === OTHER_CATEGORY_NAME.toLocaleLowerCase(),
  );
  const visibleCategories =
    !hasSections && uncategorizedItems.length > 0 && !otherCategory
      ? [
          ...categories,
          {
            id: 'uncategorized',
            tenantId: tenant.id,
            name: t('otherCategory'),
            sortOrder: 999,
            isVisible: true,
          } as Category,
        ]
      : categories;
  const itemsByCategory = !hasSections
    ? visibleCategories
        .map((cat) => ({
          category: cat,
          items: regularItems
            .filter((item) => item.categoryId === cat.id)
            .concat(
              cat.id === otherCategory?.id || (cat.id === 'uncategorized' && !otherCategory)
                ? uncategorizedItems
                : [],
            ),
        }))
        .filter(({ items: its }) => its.length > 0)
    : [];

  const buildWhatsapp = (item: MenuItem) =>
    buildWhatsAppOrderUrl({
      phone: tenant.whatsappPhone,
      slug,
      itemName: item.name,
      locale: priceLocale === 'en-US' ? 'en' : 'es',
      restaurantName: tenant.name,
      price: formatPrice(getItemPrice(item), item.currency, priceLocale),
    });

  return (
    <PublicMenuPwaWrapper
      slug={slug}
      tenantId={tenant.id}
      locale={priceLocale === 'en-US' ? 'en' : 'es'}
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
                activeLocale={priceLocale === 'en-US' ? 'en' : 'es'}
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
          <h1 className="text-2xl font-extrabold ipad:text-4xl">{tenant.name}</h1>
        </header>

        <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-[var(--brand-surface-translucent)] px-4 py-3 backdrop-blur ipad:px-6 ipad-landscape:px-8">
          {dailySpecials.length > 0 && (
            <a
              href="#especiales-hoy"
              className="whitespace-nowrap rounded-full bg-coral-500 px-4 py-2 text-sm font-extrabold text-white shadow-sm"
            >
              {t('dailySpecials')}
            </a>
          )}
          {hasSections
            ? sectionedMenu.map(({ section }) => (
                <a
                  key={section.id}
                  href={`#sec-${section.id}`}
                  className="whitespace-nowrap rounded-full bg-[var(--brand-card)] px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm"
                >
                  {section.name}
                </a>
              ))
            : itemsByCategory.map(({ category }) => (
                <a
                  key={category.id}
                  href={`#cat-${category.id}`}
                  className="whitespace-nowrap rounded-full bg-[var(--brand-card)] px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm"
                >
                  {category.name}
                </a>
              ))}
        </nav>

        <div id="menu-content" className="flex flex-col gap-8 px-4 pt-4 ipad:gap-10 ipad:px-6 ipad:pt-6 ipad-landscape:px-8 desktop:px-10">
          {dailySpecials.length > 0 && (
            <section id="especiales-hoy">
              <h2 className="mb-3 text-xl font-bold">{t('dailySpecials')}</h2>
              <div className="grid gap-3 ipad:gap-4 ipad-landscape:grid-cols-2">
                {dailySpecials.map((item) => (
                  <PublicMenuItemCard
                    key={item.id}
                    item={item}
                    whatsappHref={buildWhatsapp(item)}
                    categoryName={
                      item.categoryId ? (categoryNamesById.get(item.categoryId) ?? '') : t('otherCategory')
                    }
                    priceLocale={priceLocale}
                  />
                ))}
              </div>
            </section>
          )}

          {hasSections
            ? sectionedMenu.map(({ section, groups }) => (
                <section key={section.id} id={`sec-${section.id}`}>
                  <div
                    className="mb-3 rounded-lg px-4 py-3 ipad:mb-4 ipad:px-5 ipad:py-4"
                    style={{ backgroundColor: resolveBrandSurfaceColor(section.accentColor) }}
                  >
                    <h2 className="text-2xl font-extrabold text-ink-900 ipad:text-3xl">{section.name}</h2>
                  </div>
                  {groups.map(({ category, items: catItems }) => (
                    <div key={category.id} className="mb-4">
                      <h3 className="mb-2 px-1 text-base font-bold text-ink-700">
                        {category.name}
                      </h3>
                      <div className="grid gap-3 ipad:gap-4 ipad-landscape:grid-cols-2">
                        {catItems.map((item) => (
                          <PublicMenuItemCard
                            key={item.id}
                            item={item}
                            whatsappHref={buildWhatsapp(item)}
                            categoryName={category.name}
                            priceLocale={priceLocale}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))
            : itemsByCategory.map(({ category, items: catItems }) => (
                <section key={category.id} id={`cat-${category.id}`}>
                  <h2 className="mb-3 text-xl font-bold ipad:text-2xl">{category.name}</h2>
                  <div className="grid gap-3 ipad:gap-4 ipad-landscape:grid-cols-2">
                    {catItems.map((item) => (
                      <PublicMenuItemCard
                        key={item.id}
                        item={item}
                        whatsappHref={buildWhatsapp(item)}
                        categoryName={category.name}
                        priceLocale={priceLocale}
                      />
                    ))}
                  </div>
                </section>
              ))}
        </div>

        {tenant.plan === 'free' && (
          <footer className="mt-12 px-4 text-center text-xs text-ink-500 ipad:mt-16">
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
    const history = process.env.USE_MOCKS === 'true'
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
      />
    </>
  );
}
