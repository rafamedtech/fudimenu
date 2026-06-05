import type { Metadata } from 'next';
import { afterEach, describe, expect, it } from 'vitest';
import { buildMenuJsonLd, buildMenuMetadata, getSiteUrl, serializeJsonLd } from '@/lib/menu-seo';
import type { PublicMenuGroup } from '@/lib/public-menu-groups';
import type { MenuItem, Tenant } from '@/types/domain';

// Twitter metadata is a discriminated union; `card` only narrows after a cast.
const twitterCard = (meta: Metadata) => (meta.twitter as { card?: string } | null)?.card;

const tenant: Tenant = {
  id: 'tenant-1',
  slug: 'tacos-don-pepe',
  name: 'Tacos Don Pepe',
  logoUrl: 'https://res.cloudinary.com/x/logo.png',
  coverImageUrl: 'https://res.cloudinary.com/x/cover.jpg',
  logoShape: 'round',
  whatsappPhone: '+5215512345678',
  businessHours: null,
  primaryColor: '#F4B400',
  cuisineType: 'Mexicana',
  defaultLocale: 'es',
  currency: 'MXN',
  plan: 'pro',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const item = (overrides: Partial<MenuItem> = {}): MenuItem => ({
  id: 'item-1',
  tenantId: 'tenant-1',
  categoryId: 'cat-1',
  name: 'Taco al Pastor',
  description: 'Con piña',
  priceCents: 3500,
  currency: 'MXN',
  imageUrl: null,
  isAvailable: true,
  dietaryTags: [],
  allergenTags: [],
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const group = (overrides: Partial<PublicMenuGroup> = {}): PublicMenuGroup => ({
  sectionId: null,
  sectionName: null,
  sectionAccent: null,
  sectionCoverImageUrl: null,
  categoryId: 'cat-1',
  categoryName: 'Tacos',
  categoryCoverImageUrl: null,
  items: [item()],
  ...overrides,
});

const BASE = 'https://fudimenu.app';

describe('buildMenuMetadata', () => {
  it('emits canonical, hreflang, OG and large-image Twitter when an image exists', () => {
    const meta = buildMenuMetadata({
      tenant,
      title: 'Tacos Don Pepe — Menú',
      description: 'Menú digital de Tacos Don Pepe.',
      locale: 'es',
      baseUrl: BASE,
    });

    const canonical = 'https://fudimenu.app/m/tacos-don-pepe';
    expect(meta.metadataBase?.toString()).toBe('https://fudimenu.app/');
    expect(meta.alternates?.canonical).toBe(canonical);
    expect(meta.alternates?.languages).toEqual({
      es: canonical,
      en: `${canonical}?lang=en`,
    });
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      siteName: 'FudiMenu',
      url: canonical,
      locale: 'es_MX',
      images: [{ url: tenant.coverImageUrl, alt: tenant.name }],
    });
    expect(meta.twitter).toMatchObject({
      card: 'summary_large_image',
      images: [tenant.coverImageUrl],
    });
    // Phone auto-linking stays off so OG/Twitter scrapers don't mangle copy.
    expect(meta.formatDetection).toEqual({ telephone: false });
  });

  it('falls back to the logo and a plain summary card when there is no cover', () => {
    const meta = buildMenuMetadata({
      tenant: { ...tenant, coverImageUrl: null },
      title: 't',
      description: 'd',
      locale: 'en',
      baseUrl: BASE,
    });
    expect(meta.openGraph?.locale).toBe('en_US');
    expect(meta.openGraph?.images).toEqual([{ url: tenant.logoUrl, alt: tenant.name }]);
    expect(twitterCard(meta)).toBe('summary_large_image');
  });

  it('omits images entirely and downgrades the Twitter card with no assets', () => {
    const meta = buildMenuMetadata({
      tenant: { ...tenant, coverImageUrl: null, logoUrl: null },
      title: 't',
      description: 'd',
      locale: 'es',
      baseUrl: BASE,
    });
    expect(meta.openGraph).not.toHaveProperty('images');
    expect(twitterCard(meta)).toBe('summary');
  });
});

describe('buildMenuJsonLd', () => {
  const build = (groups: PublicMenuGroup[], dailySpecials: MenuItem[] = []) =>
    buildMenuJsonLd({
      tenant,
      groups,
      dailySpecials,
      locale: 'es',
      baseUrl: BASE,
      dailySpecialsLabel: 'Especiales de hoy',
      menuName: 'Menú',
    });

  it('links a Restaurant to its Menu in a schema.org @graph', () => {
    const jsonLd = build([group()]);
    expect(jsonLd['@context']).toBe('https://schema.org');
    const graph = jsonLd['@graph'] as Array<Record<string, unknown>>;
    const [restaurant, menu] = graph;

    expect(restaurant).toMatchObject({
      '@type': 'Restaurant',
      '@id': 'https://fudimenu.app/m/tacos-don-pepe#restaurant',
      name: 'Tacos Don Pepe',
      url: 'https://fudimenu.app/m/tacos-don-pepe',
      servesCuisine: 'Mexicana',
      telephone: '+5215512345678',
      image: tenant.coverImageUrl,
      hasMenu: { '@id': 'https://fudimenu.app/m/tacos-don-pepe#menu' },
    });
    expect(menu).toMatchObject({
      '@type': 'Menu',
      '@id': 'https://fudimenu.app/m/tacos-don-pepe#menu',
      name: 'Menú',
      inLanguage: 'es',
    });
  });

  it('drops optional Restaurant fields the tenant has not set', () => {
    const jsonLd = build([group()]);
    const restaurant = (jsonLd['@graph'] as Array<Record<string, unknown>>)[0];
    const bare = buildMenuJsonLd({
      tenant: { ...tenant, cuisineType: null, whatsappPhone: null, coverImageUrl: null, logoUrl: null },
      groups: [group()],
      dailySpecials: [],
      locale: 'es',
      baseUrl: BASE,
      dailySpecialsLabel: 'Especiales de hoy',
      menuName: 'Menú',
    });
    const bareRestaurant = (bare['@graph'] as Array<Record<string, unknown>>)[0];
    expect(restaurant).toHaveProperty('telephone');
    expect(bareRestaurant).not.toHaveProperty('telephone');
    expect(bareRestaurant).not.toHaveProperty('servesCuisine');
    expect(bareRestaurant).not.toHaveProperty('image');
  });

  it('formats Offer price as decimal and maps availability', () => {
    const jsonLd = build([group({ items: [item({ priceCents: 12000, isAvailable: false })] })]);
    const menu = (jsonLd['@graph'] as Array<Record<string, unknown>>)[1];
    const section = (menu.hasMenuSection as Array<Record<string, unknown>>)[0];
    const menuItem = (section.hasMenuItem as Array<Record<string, unknown>>)[0];
    expect(menuItem.offers).toEqual({
      '@type': 'Offer',
      price: '120.00',
      priceCurrency: 'MXN',
      availability: 'https://schema.org/OutOfStock',
    });
  });

  it('maps dietary tags to schema.org diets, ignoring spicy', () => {
    const jsonLd = build([
      group({ items: [item({ dietaryTags: ['vegan', 'gluten_free', 'spicy'] })] }),
    ]);
    const menuItem = (
      (
        (jsonLd['@graph'] as Array<Record<string, unknown>>)[1].hasMenuSection as Array<
          Record<string, unknown>
        >
      )[0].hasMenuItem as Array<Record<string, unknown>>
    )[0];
    expect(menuItem.suitableForDiet).toEqual([
      'https://schema.org/VeganDiet',
      'https://schema.org/GlutenFreeDiet',
    ]);
  });

  it('prepends a daily-specials section using the special price', () => {
    const jsonLd = build(
      [group()],
      [item({ id: 'special-1', isSpecialToday: true, specialPrice: 2900, priceCents: 3500 })],
    );
    const sections = (jsonLd['@graph'] as Array<Record<string, unknown>>)[1]
      .hasMenuSection as Array<Record<string, unknown>>;
    expect(sections[0]).toMatchObject({ name: 'Especiales de hoy' });
    const special = (sections[0].hasMenuItem as Array<Record<string, unknown>>)[0];
    expect((special.offers as Record<string, unknown>).price).toBe('29.00');
  });

  it('rolls categories up under their section name when sections are used', () => {
    const jsonLd = build([
      group({ sectionId: 'sec-1', sectionName: 'Comidas', categoryName: 'Tacos', items: [item({ id: 'a' })] }),
      group({
        sectionId: 'sec-1',
        sectionName: 'Comidas',
        categoryId: 'cat-2',
        categoryName: 'Quesadillas',
        items: [item({ id: 'b' })],
      }),
    ]);
    const sections = (jsonLd['@graph'] as Array<Record<string, unknown>>)[1]
      .hasMenuSection as Array<Record<string, unknown>>;
    expect(sections).toHaveLength(1);
    expect(sections[0].name).toBe('Comidas');
    expect((sections[0].hasMenuItem as unknown[]).length).toBe(2);
  });

  it('serializes to valid JSON for the script tag', () => {
    const jsonLd = build([group()], [item({ id: 's', isSpecialToday: true })]);
    expect(() => JSON.parse(JSON.stringify(jsonLd))).not.toThrow();
  });
});

describe('serializeJsonLd', () => {
  const build = (groups: PublicMenuGroup[]) =>
    buildMenuJsonLd({
      tenant,
      groups,
      dailySpecials: [],
      locale: 'es',
      baseUrl: BASE,
      dailySpecialsLabel: 'Especiales de hoy',
      menuName: 'Menú',
    });

  it('escapes </script> in restaurant-managed values without breaking JSON', () => {
    const malicious = '</script><script>alert(1)</script>';
    const jsonLd = build([
      group({ items: [item({ name: malicious, description: malicious })] }),
    ]);
    const serialized = serializeJsonLd(jsonLd);

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c');
    // Still valid JSON, and the original value round-trips after parsing.
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const menuItem = (
      (
        (parsed['@graph'] as Array<Record<string, unknown>>)[1].hasMenuSection as Array<
          Record<string, unknown>
        >
      )[0].hasMenuItem as Array<Record<string, unknown>>
    )[0];
    expect(menuItem.name).toBe(malicious);
  });

  it('escapes U+2028/U+2029 line terminators', () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const raw = `a${ls}b${ps}c`;
    const serialized = serializeJsonLd({ x: raw });
    expect(serialized).toContain('\\u2028');
    expect(serialized).toContain('\\u2029');
    expect(serialized).not.toContain(ls);
    expect(serialized).not.toContain(ps);
    expect(JSON.parse(serialized)).toEqual({ x: raw });
  });
});

describe('getSiteUrl', () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;
  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('strips a trailing slash', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://fudimenu.app/';
    expect(getSiteUrl()).toBe('https://fudimenu.app');
  });

  it('falls back to localhost when unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });
});
