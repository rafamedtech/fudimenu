import dynamic from 'next/dynamic';
import { notFound, permanentRedirect } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { getCategoryEmoji } from '@/lib/category-placeholder';
import { formatPrice } from '@/lib/utils';
import { buildWhatsAppOrderUrl } from '@/lib/whatsapp';
import { menuService } from '@/server/services/menu.service';
import { getPrisma } from '@/lib/db/prisma';
import { PublicMenuLanguageSwitcher, PublicMenuPwaWrapper } from './public-menu-pwa-wrapper';
import type { Metadata } from 'next';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

// Node.js runtime (not Edge) — Prisma requires Node.js APIs.
export const revalidate = 60;

// Deferred: loads posthog + fetch tracker after hydration, not on initial paint.
const PublicMenuTracker = dynamic(
  () => import('@/components/public/public-menu-tracking').then((m) => m.PublicMenuTracker),
  { ssr: false },
);
const OTHER_CATEGORY_NAME = 'Otros';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: 'es' | 'en' }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTranslations('menu');
  const tenant = await menuService.getTenantBySlug(slug);
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
      className="flex gap-3 rounded-lg bg-white p-3 shadow-sm"
      data-item-id={item.id}
      data-item-category={categoryName}
    >
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-crema-100">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
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
          <h3 className="font-semibold text-ink-900">{item.name}</h3>
          {item.isSpecialToday && (
            <span className="shrink-0 rounded-full bg-coral-500 px-2 py-1 text-[10px] font-extrabold uppercase text-white">
              {t('special')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm text-ink-500">{item.description}</p>
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
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-menta-500 px-3 text-sm font-extrabold text-ink-900 shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
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

  const buildWhatsapp = (itemName: string) =>
    buildWhatsAppOrderUrl({
      phone: tenant.whatsappPhone,
      slug,
      itemName,
      locale: priceLocale === 'en-US' ? 'en' : 'es',
    });

  return (
    <PublicMenuPwaWrapper slug={slug}>
      <PublicMenuTracker tenantId={tenant.id} slug={slug} />
      <main
        className="mx-auto min-h-dvh max-w-md scroll-smooth bg-crema-50 pb-12"
        style={{ ['--brand' as string]: tenant.primaryColor }}
      >
        <a
          href="#menu-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-ink-900"
        >
          Saltar al menú
        </a>
        <header className="relative bg-white px-6 py-8 text-center shadow-sm">
          <div className="absolute right-4 top-4">
            <PublicMenuLanguageSwitcher />
          </div>
          {tenant.logoUrl ? (
            <Image
              src={tenant.logoUrl}
              alt={tenant.name}
              width={80}
              height={80}
              className="mx-auto mb-3 rounded-full"
            />
          ) : (
            <div
              className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
              style={{ backgroundColor: tenant.primaryColor + '33' }}
            >
              🍽️
            </div>
          )}
          <h1 className="text-2xl font-extrabold">{tenant.name}</h1>
        </header>

        <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-crema-50/95 px-4 py-3 backdrop-blur">
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
                  className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm"
                >
                  {section.name}
                </a>
              ))
            : itemsByCategory.map(({ category }) => (
                <a
                  key={category.id}
                  href={`#cat-${category.id}`}
                  className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm"
                >
                  {category.name}
                </a>
              ))}
        </nav>

        <div id="menu-content" className="flex flex-col gap-8 px-4 pt-4">
          {dailySpecials.length > 0 && (
            <section id="especiales-hoy">
              <h2 className="mb-3 text-xl font-bold">{t('dailySpecials')}</h2>
              <div className="flex flex-col gap-3">
                {dailySpecials.map((item) => (
                  <PublicMenuItemCard
                    key={item.id}
                    item={item}
                    whatsappHref={buildWhatsapp(item.name)}
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
                    className="mb-3 rounded-lg px-4 py-3"
                    style={{ backgroundColor: section.accentColor }}
                  >
                    <h2 className="text-2xl font-extrabold text-ink-900">{section.name}</h2>
                  </div>
                  {groups.map(({ category, items: catItems }) => (
                    <div key={category.id} className="mb-4">
                      <h3 className="mb-2 px-1 text-base font-bold text-ink-700">
                        {category.name}
                      </h3>
                      <div className="flex flex-col gap-3">
                        {catItems.map((item) => (
                          <PublicMenuItemCard
                            key={item.id}
                            item={item}
                            whatsappHref={buildWhatsapp(item.name)}
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
                  <h2 className="mb-3 text-xl font-bold">{category.name}</h2>
                  <div className="flex flex-col gap-3">
                    {catItems.map((item) => (
                      <PublicMenuItemCard
                        key={item.id}
                        item={item}
                        whatsappHref={buildWhatsapp(item.name)}
                        categoryName={category.name}
                        priceLocale={priceLocale}
                      />
                    ))}
                  </div>
                </section>
              ))}
        </div>

        {tenant.plan === 'free' && (
          <footer className="mt-12 text-center text-xs text-ink-500">
            {t('madeWith')}{' '}
            <a href="/" className="font-bold text-mostaza-500 hover:underline">
              FudiMenu
            </a>
          </footer>
        )}
      </main>
    </PublicMenuPwaWrapper>
  );
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const tenant = await menuService.getTenantBySlug(slug);
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
    menuService.getMenuByTenantId(tenant.id),
    getLocale(),
  ]);

  return (
    <PublicMenuContent
      slug={slug}
      tenant={tenant}
      sections={sections}
      categories={categories}
      items={items}
      priceLocale={locale === 'en' ? 'en-US' : 'es-MX'}
    />
  );
}
