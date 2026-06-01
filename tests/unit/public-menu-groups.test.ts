import { describe, expect, it } from 'vitest';
import { buildPublicMenuGroups } from '@/lib/public-menu-groups';
import type { Category, MenuItem, MenuSection } from '@/types/domain';

const item = (id: string, categoryId: string | null, isSpecialToday = false): MenuItem => ({
  id,
  tenantId: 'tenant-1',
  categoryId,
  name: id,
  description: null,
  priceCents: 100,
  isSpecialToday,
  currency: 'MXN',
  imageUrl: null,
  isAvailable: true,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const category = (
  id: string,
  sectionId: string | null,
  name = id,
  isVisible = true,
): Category => ({
  id,
  tenantId: 'tenant-1',
  sectionId,
  name,
  coverImageUrl: null,
  sortOrder: 0,
  isVisible,
});

const section = (id: string, isVisible = true): MenuSection => ({
  id,
  tenantId: 'tenant-1',
  name: id,
  coverImageUrl: null,
  accentColor: `accent-${id}`,
  sortOrder: 0,
  isVisible,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const build = (sections: MenuSection[], categories: Category[], items: MenuItem[]) =>
  buildPublicMenuGroups({
    sections,
    categories,
    items,
    otherCategoryName: 'Otros',
    resolveSectionAccent: (accent) => `resolved-${accent}`,
  });

describe('buildPublicMenuGroups', () => {
  it('preserves section, category, and item order while excluding hidden and special items', () => {
    const result = build(
      [section('section-2'), section('hidden-section', false), section('section-1')],
      [
        category('category-1', 'section-1'),
        category('category-2', 'section-2'),
        category('hidden-category', 'section-2', 'hidden-category', false),
      ],
      [
        item('item-2a', 'category-2'),
        item('item-2b', 'category-2'),
        item('hidden-category-item', 'hidden-category'),
        item('special', 'category-1', true),
        item('item-1', 'category-1'),
      ],
    );

    expect(result.dailySpecials.map(({ id }) => id)).toEqual(['special']);
    expect(result.groups).toMatchObject([
      {
        sectionId: 'section-2',
        sectionAccent: 'resolved-accent-section-2',
        categoryId: 'category-2',
        items: [{ id: 'item-2a' }, { id: 'item-2b' }],
      },
      {
        sectionId: 'section-1',
        sectionAccent: 'resolved-accent-section-1',
        categoryId: 'category-1',
        items: [{ id: 'item-1' }],
      },
    ]);
  });

  it('appends uncategorized items to the existing Otros category without sections', () => {
    const result = build(
      [],
      [category('food', null), category('other', null, ' Otros ')],
      [item('food-item', 'food'), item('other-item', 'other'), item('uncategorized', null)],
    );

    expect(result.groups.map(({ categoryId, items }) => [categoryId, items.map(({ id }) => id)]))
      .toEqual([
        ['food', ['food-item']],
        ['other', ['other-item', 'uncategorized']],
      ]);
  });

  it('creates an Otros group for uncategorized items when the category does not exist', () => {
    const result = build([], [category('food', null)], [
      item('food-item', 'food'),
      item('uncategorized', null),
    ]);

    expect(result.groups.map(({ categoryId, categoryName, items }) => [
      categoryId,
      categoryName,
      items.map(({ id }) => id),
    ])).toEqual([
      ['food', 'food', ['food-item']],
      ['uncategorized', 'Otros', ['uncategorized']],
    ]);
  });
});
