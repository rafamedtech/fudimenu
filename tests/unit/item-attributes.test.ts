import { describe, expect, it } from 'vitest';
import {
  getItemBadges,
  getItemBadgesAccessibleLabel,
  normalizeAllergenTags,
  normalizeDietaryTags,
  type BadgeLabels,
} from '@/lib/item-attributes';
import { itemSchema } from '@/lib/validators/item.schema';
import { MockMenuRepository } from '@/server/repositories/mock-menu.repository';
import type { MenuItem } from '@/types/domain';

const TENANT = 'tnt_demo';

const labels: BadgeLabels = {
  dietary: { vegan: 'Vegan', vegetarian: 'Vegetarian', gluten_free: 'GF', spicy: 'Spicy' },
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
};

describe('normalize tag lists', () => {
  // Public attribute lists are an allowlist, not free text: a client must never
  // be able to persist an arbitrary or injected value via these fields.
  it('drops values outside the allowlist', () => {
    expect(normalizeDietaryTags(['vegan', 'keto', '<script>'])).toEqual(['vegan']);
    expect(normalizeAllergenTags(['dairy', 'gold', ''])).toEqual(['dairy']);
  });

  // Render order must be deterministic regardless of how the admin clicked the
  // toggles, so badges don't reshuffle between saves.
  it('dedupes and returns canonical allowlist order', () => {
    expect(normalizeDietaryTags(['spicy', 'vegan', 'spicy', 'vegan'])).toEqual(['vegan', 'spicy']);
    expect(normalizeAllergenTags(['fish', 'dairy', 'fish'])).toEqual(['dairy', 'fish']);
  });
});

describe('getItemBadges', () => {
  it('lists dietary badges before allergen warnings with resolved labels', () => {
    const badges = getItemBadges(
      { dietaryTags: ['spicy', 'vegan'], allergenTags: ['nuts', 'dairy'] },
      labels,
    );
    expect(badges).toEqual([
      { key: 'vegan', kind: 'dietary', label: 'Vegan' },
      { key: 'spicy', kind: 'dietary', label: 'Spicy' },
      { key: 'dairy', kind: 'allergen', label: 'Dairy' },
      { key: 'nuts', kind: 'allergen', label: 'Nuts' },
    ]);
  });

  // Items without attributes must render nothing — no empty badge row.
  it('returns an empty list when there are no tags', () => {
    expect(getItemBadges({ dietaryTags: [], allergenTags: [] }, labels)).toEqual([]);
  });
});

describe('getItemBadgesAccessibleLabel', () => {
  // The card badges live inside a button with aria-label, which would hide them
  // from screen readers; their meaning must travel in the accessible name, with
  // allergens flagged as "contains" so they aren't read as suitability.
  it('separates dietary suitability from a contains-prefixed allergen warning', () => {
    const badges = getItemBadges(
      { dietaryTags: ['vegan'], allergenTags: ['dairy', 'nuts'] },
      labels,
    );
    expect(getItemBadgesAccessibleLabel(badges, { contains: 'Contains' })).toBe(
      'Vegan. Contains: Dairy, Nuts',
    );
  });

  it('returns an empty string when there are no badges', () => {
    expect(getItemBadgesAccessibleLabel([], { contains: 'Contains' })).toBe('');
  });
});

describe('itemSchema diet/allergen validation', () => {
  const base = { categoryId: null, name: 'Taco', priceCents: 100 };

  // Server-side parse is the security boundary: disallowed values must be
  // stripped even if a crafted request includes them.
  it('strips disallowed values and dedupes on parse', () => {
    const parsed = itemSchema.parse({
      ...base,
      dietaryTags: ['vegan', 'vegan', 'hacker'],
      allergenTags: ['dairy', 'unknown'],
    });
    expect(parsed.dietaryTags).toEqual(['vegan']);
    expect(parsed.allergenTags).toEqual(['dairy']);
  });

  // Bound the payload so a request can't ship a giant array.
  it('rejects arrays beyond the per-list cap', () => {
    const huge = Array.from({ length: 50 }, (_, i) => `t${i}`);
    expect(itemSchema.safeParse({ ...base, dietaryTags: huge }).success).toBe(false);
  });
});

describe('MockMenuRepository persists public attributes', () => {
  function dietary(item: MenuItem) {
    return item.dietaryTags;
  }

  it('stores normalized tags on create', async () => {
    const repo = new MockMenuRepository();
    const created = await repo.upsertItem(TENANT, {
      name: 'Ensalada',
      priceCents: 100,
      dietaryTags: ['spicy', 'vegan', 'spicy'],
      allergenTags: ['nuts', 'notreal'],
    });
    expect(dietary(created)).toEqual(['vegan', 'spicy']);
    expect(created.allergenTags).toEqual(['nuts']);
  });

  // A partial update (e.g. editing only the name) must not wipe tags the admin
  // set earlier — the field is only touched when the caller sends it.
  it('preserves existing tags when the field is omitted on update', async () => {
    const repo = new MockMenuRepository();
    const created = await repo.upsertItem(TENANT, {
      name: 'Sopa',
      priceCents: 100,
      dietaryTags: ['vegan'],
    });

    const updated = await repo.upsertItem(TENANT, { id: created.id, name: 'Sopa fría', priceCents: 120 });
    expect(updated.dietaryTags).toEqual(['vegan']);

    const cleared = await repo.upsertItem(TENANT, {
      id: created.id,
      name: 'Sopa fría',
      priceCents: 120,
      dietaryTags: [],
    });
    expect(cleared.dietaryTags).toEqual([]);
  });
});
