import { describe, expect, it } from 'vitest';
import { buildPublicMenuGroups } from '@/lib/public-menu-groups';
import { EMPTY_VISIBILITY_SCHEDULE } from '@/lib/visibility-schedule';
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
  dietaryTags: [],
  allergenTags: [],
  ...EMPTY_VISIBILITY_SCHEDULE,
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
  ...EMPTY_VISIBILITY_SCHEDULE,
});

const section = (id: string, isVisible = true): MenuSection => ({
  id,
  tenantId: 'tenant-1',
  name: id,
  coverImageUrl: null,
  accentColor: `accent-${id}`,
  sortOrder: 0,
  isVisible,
  ...EMPTY_VISIBILITY_SCHEDULE,
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

  it('filters out off-schedule items (and off-schedule specials) at the given instant', () => {
    // Breakfast window: Mon–Fri 07:00–11:00 Tijuana. Evaluate at Mon 08:00.
    const breakfast = (id: string, isSpecialToday = false): MenuItem => ({
      ...item(id, 'category-1', isSpecialToday),
      scheduleDays: [1, 2, 3, 4, 5],
      scheduleStartMinute: 420,
      scheduleEndMinute: 660,
    });
    const monday0800 = new Date('2024-01-15T16:00:00Z');
    const monday1300 = new Date('2024-01-15T21:00:00Z');

    const visible = buildPublicMenuGroups({
      sections: [],
      categories: [category('category-1', null)],
      items: [breakfast('on-time'), breakfast('special-on-time', true)],
      otherCategoryName: 'Otros',
      resolveSectionAccent: (accent) => accent,
      now: monday0800,
    });
    expect(visible.groups[0]?.items.map(({ id }) => id)).toEqual(['on-time']);
    expect(visible.dailySpecials.map(({ id }) => id)).toEqual(['special-on-time']);

    // Same items, after the window closes → nothing shows, not even the special.
    const hidden = buildPublicMenuGroups({
      sections: [],
      categories: [category('category-1', null)],
      items: [breakfast('on-time'), breakfast('special-on-time', true)],
      otherCategoryName: 'Otros',
      resolveSectionAccent: (accent) => accent,
      now: monday1300,
    });
    expect(hidden.groups).toEqual([]);
    expect(hidden.dailySpecials).toEqual([]);
  });

  it('applies the full hierarchy: section gates category gates item (CDMX default tz)', () => {
    // 07:00–11:00 window. 2024-01-15T16:00:00Z = CDMX 10:00 (in), T21:00Z = 15:00 (out).
    const window = { scheduleStartMinute: 420, scheduleEndMinute: 660 };
    const monday1000 = new Date('2024-01-15T16:00:00Z');
    const monday1500 = new Date('2024-01-15T21:00:00Z');

    const scheduledSection: MenuSection = { ...section('section-1'), ...window };

    const run = (now: Date, sections: MenuSection[], categories: Category[]) =>
      buildPublicMenuGroups({
        sections,
        categories,
        items: [item('it', 'category-1')],
        otherCategoryName: 'Otros',
        resolveSectionAccent: (a) => a,
        now,
      });

    // Section off-window → whole branch hidden even though category + item are open.
    const sectionOff = run(monday1500, [scheduledSection], [category('category-1', 'section-1')]);
    expect(sectionOff.groups).toEqual([]);

    // Section open but category off-window → items hidden.
    const categoryWindowed: Category = { ...category('category-1', 'section-1'), ...window };
    const catOff = run(monday1500, [section('section-1')], [categoryWindowed]);
    expect(catOff.groups).toEqual([]);

    // Everything in-window → item shows.
    const allOn = run(monday1000, [scheduledSection], [categoryWindowed]);
    expect(allOn.groups.flatMap((g) => g.items.map((i) => i.id))).toEqual(['it']);
  });

  it('gates dailySpecials by their category and section window', () => {
    // 07:00–11:00 window. T16:00:00Z = CDMX 10:00 (in), T21:00:00Z = 15:00 (out).
    const window = { scheduleStartMinute: 420, scheduleEndMinute: 660 };
    const monday1000 = new Date('2024-01-15T16:00:00Z');
    const monday1500 = new Date('2024-01-15T21:00:00Z');
    const special = item('special', 'category-1', true); // own schedule: always open

    const run = (now: Date, sections: MenuSection[], categories: Category[], items = [special]) =>
      buildPublicMenuGroups({
        sections,
        categories,
        items,
        otherCategoryName: 'Otros',
        resolveSectionAccent: (a) => a,
        now,
      });

    // Category off-window → special hidden even though the item itself is open.
    const catWindowed: Category = { ...category('category-1', null), ...window };
    expect(run(monday1500, [], [catWindowed]).dailySpecials).toEqual([]);
    // Category in-window → special shows.
    expect(run(monday1000, [], [catWindowed]).dailySpecials.map((i) => i.id)).toEqual(['special']);

    // Section off-window (category open) → special hidden by the section.
    const sectionWindowed: MenuSection = { ...section('section-1'), ...window };
    const catInSection = category('category-1', 'section-1');
    expect(run(monday1500, [sectionWindowed], [catInSection]).dailySpecials).toEqual([]);
    // Both parents in-window → special shows.
    expect(
      run(monday1000, [sectionWindowed], [catInSection]).dailySpecials.map((i) => i.id),
    ).toEqual(['special']);
  });

  it('keeps a category-less special dependent on its own schedule only', () => {
    const monday1500 = new Date('2024-01-15T21:00:00Z'); // outside any 07:00–11:00 window
    const orphanSpecial = item('orphan', null, true); // no category, own schedule always open
    // A closed category exists but the special does not belong to it.
    const closedCategory: Category = {
      ...category('category-1', null),
      scheduleStartMinute: 420,
      scheduleEndMinute: 660,
    };

    const result = buildPublicMenuGroups({
      sections: [],
      categories: [closedCategory],
      items: [orphanSpecial],
      otherCategoryName: 'Otros',
      resolveSectionAccent: (a) => a,
      now: monday1500,
    });
    // No parent to inherit from → visible on its own schedule.
    expect(result.dailySpecials.map((i) => i.id)).toEqual(['orphan']);
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
