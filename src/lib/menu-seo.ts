import type { Metadata } from 'next';
import type { Locale, MenuItem, Tenant } from '@/types/domain';
import type { PublicMenuGroup } from '@/lib/public-menu-groups';

/**
 * SEO helpers for the public menu (`/m/[slug]`): canonical/OG/Twitter metadata
 * and schema.org JSON-LD (Restaurant → Menu → MenuItem). Pure and framework-free
 * so the structure stays unit-testable without a DOM or Next runtime. Scope is
 * strictly discovery/sharing — no POS, ordering or delivery semantics.
 */

const FALLBACK_SITE_URL = 'http://localhost:3000';

/** Normalized absolute site origin (no trailing slash). Mirrors the qr/* helpers. */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_SITE_URL).replace(/\/$/, '');
}

/** Canonical URL for a tenant's public menu. */
export function getMenuUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/m/${slug}`;
}

function ogLocale(locale: Locale): string {
  return locale === 'en' ? 'en_US' : 'es_MX';
}

/** Decimal price string schema.org Offer expects (e.g. 120 → "1.20"). */
function formatOfferPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function priceForItem(item: MenuItem): number {
  return item.isSpecialToday ? item.specialPrice ?? item.priceCents : item.priceCents;
}

// schema.org RestrictedDiet enum — only diets with a canonical URL map. "spicy"
// is not a diet, so it is intentionally omitted (rendered as a UI badge only).
const DIET_SCHEMA_URL: Partial<Record<string, string>> = {
  vegan: 'https://schema.org/VeganDiet',
  vegetarian: 'https://schema.org/VegetarianDiet',
  gluten_free: 'https://schema.org/GlutenFreeDiet',
};

type MenuTenant = Pick<
  Tenant,
  'name' | 'slug' | 'logoUrl' | 'coverImageUrl' | 'cuisineType' | 'whatsappPhone'
>;

export interface MenuMetadataInput {
  tenant: Pick<MenuTenant, 'name' | 'slug' | 'logoUrl' | 'coverImageUrl' | 'cuisineType'>;
  title: string;
  description: string;
  locale: Locale;
  baseUrl: string;
}

/**
 * Rich, consistent metadata for every public menu: canonical + hreflang
 * alternates, Open Graph and Twitter cards. Image falls back cover → logo so the
 * share preview is never blank when either asset exists.
 */
export function buildMenuMetadata({
  tenant,
  title,
  description,
  locale,
  baseUrl,
}: MenuMetadataInput): Metadata {
  const canonical = getMenuUrl(baseUrl, tenant.slug);
  const imageUrl = tenant.coverImageUrl ?? tenant.logoUrl;
  const images = imageUrl ? [{ url: imageUrl, alt: tenant.name }] : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    formatDetection: { telephone: false },
    alternates: {
      canonical,
      languages: {
        es: canonical,
        en: `${canonical}?lang=en`,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'FudiMenu',
      title,
      description,
      url: canonical,
      locale: ogLocale(locale),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

interface JsonLdMenuSection {
  '@type': 'MenuSection';
  name: string;
  hasMenuItem: JsonLdMenuItem[];
}

interface JsonLdMenuItem {
  '@type': 'MenuItem';
  name: string;
  description?: string;
  suitableForDiet?: string[];
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

export interface MenuJsonLdInput {
  tenant: MenuTenant;
  groups: PublicMenuGroup[];
  dailySpecials: MenuItem[];
  locale: Locale;
  baseUrl: string;
  /** Localized label for the daily-specials section (e.g. "Especiales de hoy"). */
  dailySpecialsLabel: string;
  /** Localized name for the menu node (e.g. "Menú"). */
  menuName: string;
}

function toJsonLdItem(item: MenuItem): JsonLdMenuItem {
  const diets = (item.dietaryTags ?? [])
    .map((tag) => DIET_SCHEMA_URL[tag])
    .filter((url): url is string => Boolean(url));

  return {
    '@type': 'MenuItem',
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
    ...(diets.length > 0 ? { suitableForDiet: diets } : {}),
    offers: {
      '@type': 'Offer',
      price: formatOfferPrice(priceForItem(item)),
      priceCurrency: item.currency,
      availability: item.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };
}

/**
 * Collapse the display groups into schema.org MenuSections. When the tenant uses
 * sections, items roll up under their section name; otherwise each category is
 * its own section — matching exactly what the comensal sees rendered.
 */
function buildMenuSections({
  groups,
  dailySpecials,
  dailySpecialsLabel,
}: Pick<MenuJsonLdInput, 'groups' | 'dailySpecials' | 'dailySpecialsLabel'>): JsonLdMenuSection[] {
  const sections: JsonLdMenuSection[] = [];

  if (dailySpecials.length > 0) {
    sections.push({
      '@type': 'MenuSection',
      name: dailySpecialsLabel,
      hasMenuItem: dailySpecials.map(toJsonLdItem),
    });
  }

  const usesSections = groups.some((g) => g.sectionId);
  if (usesSections) {
    const bySection = new Map<string, JsonLdMenuSection>();
    for (const group of groups) {
      const key = group.sectionId ?? '__nosec__';
      const name = group.sectionName ?? group.categoryName;
      let section = bySection.get(key);
      if (!section) {
        section = { '@type': 'MenuSection', name, hasMenuItem: [] };
        bySection.set(key, section);
        sections.push(section);
      }
      section.hasMenuItem.push(...group.items.map(toJsonLdItem));
    }
  } else {
    for (const group of groups) {
      sections.push({
        '@type': 'MenuSection',
        name: group.categoryName,
        hasMenuItem: group.items.map(toJsonLdItem),
      });
    }
  }

  return sections;
}

/**
 * schema.org `@graph` with a Restaurant linked to its Menu. Returns a plain
 * object the page serializes into a `<script type="application/ld+json">`.
 */
export function buildMenuJsonLd({
  tenant,
  groups,
  dailySpecials,
  locale,
  baseUrl,
  dailySpecialsLabel,
  menuName,
}: MenuJsonLdInput): Record<string, unknown> {
  const url = getMenuUrl(baseUrl, tenant.slug);
  const image = tenant.coverImageUrl ?? tenant.logoUrl;

  const restaurant: Record<string, unknown> = {
    '@type': 'Restaurant',
    '@id': `${url}#restaurant`,
    name: tenant.name,
    url,
    hasMenu: { '@id': `${url}#menu` },
  };
  if (image) restaurant.image = image;
  if (tenant.cuisineType) restaurant.servesCuisine = tenant.cuisineType;
  if (tenant.whatsappPhone) restaurant.telephone = tenant.whatsappPhone;

  const menu = {
    '@type': 'Menu',
    '@id': `${url}#menu`,
    name: menuName,
    inLanguage: locale,
    hasMenuSection: buildMenuSections({ groups, dailySpecials, dailySpecialsLabel }),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [restaurant, menu],
  };
}
