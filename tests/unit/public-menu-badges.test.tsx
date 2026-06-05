import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ItemList,
  ItemSheet,
  type IslandStrings,
} from '@/app/(public)/m/[slug]/public-menu-island';
import type { MenuItem } from '@/types/domain';

const strings: IslandStrings = {
  searchPlaceholder: 'Search',
  searchAria: 'Search',
  searchClear: 'Clear',
  searchEmpty: 'No results',
  closeSheet: 'Close',
  sectionLabel: 'Section',
  special: 'Special',
  soldOut: 'Sold out',
  orderWhatsApp: 'Order',
  viewDetail: 'View detail',
  dailySpecials: 'Specials',
  otherCategory: 'Other',
  variantsFrom: 'From',
  variantsTitle: 'Options',
  allergenDisclaimer: 'Allergen and dietary information is managed by the restaurant.',
  containsAllergens: 'Contains',
  badges: {
    dietary: { vegan: 'Vegan', vegetarian: 'Vegetarian', gluten_free: 'Gluten-free', spicy: 'Spicy' },
    allergen: {
      dairy: 'Dairy',
      nuts: 'Nuts',
      peanuts: 'Peanuts',
      gluten: 'Gluten',
      shellfish: 'Shellfish',
      fish: 'Fish',
      eggs: 'Eggs',
      soy: 'Soy',
      sesame: 'Sesame',
    },
  },
};

// imageUrl null keeps next/image out of the render (emoji fallback), so the
// markup is deterministic without an image runtime.
const item: MenuItem = {
  id: 'i1',
  tenantId: 't1',
  categoryId: 'c1',
  name: 'Ensalada',
  description: 'Fresca',
  priceCents: 12000,
  currency: 'MXN',
  imageUrl: null,
  isAvailable: true,
  dietaryTags: ['vegan'],
  allergenTags: ['dairy', 'nuts'],
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('public card badge render', () => {
  const html = renderToStaticMarkup(
    <ItemList
      items={[item]}
      categoryName="Ensaladas"
      onSelect={() => {}}
      priceLocale="es-MX"
      strings={strings}
    />,
  );

  it('shows the badge labels visually on the card', () => {
    expect(html).toContain('Vegan');
    expect(html).toContain('Dairy');
    expect(html).toContain('Nuts');
  });

  // The screen-reader fix: the button's accessible name must carry the badges,
  // with allergens flagged as "contains".
  it('folds the badges into the button accessible name', () => {
    expect(html).toContain('aria-label="Ensalada. Vegan. Contains: Dairy, Nuts — View detail"');
  });

  // ...and the visual chips are hidden from the a11y tree to avoid double reads.
  it('marks the visual chip list aria-hidden on the card', () => {
    expect(html).toContain('aria-hidden="true"');
  });
});

// Visual variants: the card advertises "from <min>", the sheet lists each
// option with its own price instead of a single price.
const variantItem: MenuItem = {
  ...item,
  id: 'i2',
  name: 'Jugo',
  dietaryTags: [],
  allergenTags: [],
  priceCents: 8500,
  variants: [
    { id: 'v1', name: 'Chico', priceCents: 8500, sortOrder: 0 },
    { id: 'v2', name: 'Grande', priceCents: 9500, sortOrder: 1 },
  ],
};

describe('public card variant render', () => {
  const html = renderToStaticMarkup(
    <ItemList
      items={[variantItem]}
      categoryName="Jugos"
      onSelect={() => {}}
      priceLocale="es-MX"
      strings={strings}
    />,
  );

  it('shows the from-price using the cheapest variant', () => {
    expect(html).toContain('From $85');
    // The pricier variant should not leak into the card price line.
    expect(html).not.toContain('$95');
  });
});

describe('public detail variant render', () => {
  const html = renderToStaticMarkup(
    <ItemSheet
      item={variantItem}
      categoryName="Jugos"
      open
      onClose={() => {}}
      onClosed={() => {}}
      priceLocale="es-MX"
      whatsappUrl={null}
      strings={strings}
    />,
  );

  it('lists each variant with its own price', () => {
    expect(html).toContain('Options');
    expect(html).toContain('Chico');
    expect(html).toContain('$85');
    expect(html).toContain('Grande');
    expect(html).toContain('$95');
  });
});

describe('public detail badge render', () => {
  const html = renderToStaticMarkup(
    <ItemSheet
      item={item}
      categoryName="Ensaladas"
      open
      onClose={() => {}}
      onClosed={() => {}}
      priceLocale="es-MX"
      whatsappUrl={null}
      strings={strings}
    />,
  );

  it('shows badges and the visible disclaimer in the detail sheet', () => {
    expect(html).toContain('Vegan');
    expect(html).toContain('Dairy');
    expect(html).toContain(
      'Allergen and dietary information is managed by the restaurant.',
    );
  });
});
