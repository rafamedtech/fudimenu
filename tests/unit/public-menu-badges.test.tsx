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

  it('places the category as supporting copy after the item title', () => {
    expect(html).toContain('>Ensaladas</p>');
    expect(html.indexOf('Ensalada</h2>')).toBeLessThan(html.indexOf('>Ensaladas</p>'));
  });
});
