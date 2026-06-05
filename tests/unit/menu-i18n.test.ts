import { describe, expect, it } from 'vitest';
import { EMPTY_VISIBILITY_SCHEDULE } from '@/lib/visibility-schedule';
import {
  getAlternateLocale,
  getItemTranslationStatus,
  localizeMenuItem,
  localizeMenuItems,
} from '@/lib/menu-i18n';
import type { ItemTranslation, MenuItem } from '@/types/domain';

function makeItem(
  translations?: ItemTranslation[],
  overrides?: Partial<MenuItem>,
): MenuItem {
  return {
    id: 'i1',
    tenantId: 't1',
    categoryId: null,
    name: 'Tacos al pastor',
    description: 'Con piña',
    priceCents: 5000,
    currency: 'MXN',
    imageUrl: null,
    isAvailable: true,
    dietaryTags: [],
    allergenTags: [],
    ...EMPTY_VISIBILITY_SCHEDULE,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    translations,
    ...overrides,
  };
}

describe('localizeMenuItem', () => {
  // Default-locale views must never pay the cost of (or risk) a translation swap.
  it('returns the base item unchanged when viewing the default locale', () => {
    const item = makeItem([
      { itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: 'With pineapple' },
    ]);
    expect(localizeMenuItem(item, 'es', 'es')).toBe(item);
  });

  it('swaps name and description to the requested locale when fully translated', () => {
    const item = makeItem([
      { itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: 'With pineapple' },
    ]);
    const result = localizeMenuItem(item, 'en', 'es');
    expect(result.name).toBe('Pastor tacos');
    expect(result.description).toBe('With pineapple');
  });

  // A blank translated field would otherwise show an empty title/description to
  // the comensal — the public menu must always render readable content.
  it('falls back per field to the base locale when a translated field is blank', () => {
    const item = makeItem([
      { itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: '   ' },
    ]);
    const result = localizeMenuItem(item, 'en', 'es');
    expect(result.name).toBe('Pastor tacos');
    expect(result.description).toBe('Con piña');
  });

  it('returns the base item when no translation exists for the locale', () => {
    const item = makeItem([
      { itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: 'With pineapple' },
    ]);
    // Default 'en', viewing 'es' with no 'es' translation → base.
    expect(localizeMenuItem(item, 'es', 'en')).toBe(item);
  });

  it('returns the base item when the item has no translations at all', () => {
    const item = makeItem();
    expect(localizeMenuItem(item, 'en', 'es')).toBe(item);
  });
});

describe('localizeMenuItems', () => {
  it('localizes every item in the list', () => {
    const items = [
      makeItem([{ itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: 'Yum' }]),
      makeItem(),
    ];
    const result = localizeMenuItems(items, 'en', 'es');
    expect(result[0].name).toBe('Pastor tacos');
    expect(result[1].name).toBe('Tacos al pastor');
  });
});

describe('getAlternateLocale', () => {
  it('returns the non-default locale', () => {
    expect(getAlternateLocale('es')).toBe('en');
    expect(getAlternateLocale('en')).toBe('es');
  });
});

describe('getItemTranslationStatus', () => {
  it('is untranslated when no translation row exists', () => {
    expect(getItemTranslationStatus(makeItem(), 'es')).toBe('untranslated');
  });

  // A blank-only override carries no comensal-facing content, so it must not
  // read as a partial translation.
  it('is untranslated when the translation has only blank fields', () => {
    const item = makeItem([{ itemId: 'i1', locale: 'en', name: '  ', description: '' }]);
    expect(getItemTranslationStatus(item, 'es')).toBe('untranslated');
  });

  it('is incomplete when the base has a description but only the name is translated', () => {
    const item = makeItem([{ itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: '' }]);
    expect(getItemTranslationStatus(item, 'es')).toBe('incomplete');
  });

  it('is translated when both name and description are translated', () => {
    const item = makeItem([
      { itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: 'With pineapple' },
    ]);
    expect(getItemTranslationStatus(item, 'es')).toBe('translated');
  });

  // When the base item has no description, only the name is translatable, so a
  // translated name alone is fully translated — never stuck at "incomplete".
  it('is translated with name only when the base has no description', () => {
    const item = makeItem(
      [{ itemId: 'i1', locale: 'en', name: 'Pastor tacos', description: null }],
      { description: null },
    );
    expect(getItemTranslationStatus(item, 'es')).toBe('translated');
  });

  it('reads the alternate locale relative to the tenant default', () => {
    // Default 'en' → status is computed for the 'es' translation.
    const item = makeItem([
      { itemId: 'i1', locale: 'es', name: 'Tacos al pastor', description: 'Con piña' },
    ]);
    expect(getItemTranslationStatus(item, 'en')).toBe('translated');
  });
});
