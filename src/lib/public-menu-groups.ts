import type { Category, MenuItem, MenuSection } from '@/types/domain';
import { isItemVisibleNow } from '@/lib/visibility-schedule';

export interface PublicMenuGroup {
  sectionId: string | null;
  sectionName: string | null;
  sectionAccent: string | null;
  sectionCoverImageUrl: string | null;
  categoryId: string;
  categoryName: string;
  categoryCoverImageUrl: string | null;
  items: MenuItem[];
}

interface BuildPublicMenuGroupsOptions {
  sections: MenuSection[];
  categories: Category[];
  items: MenuItem[];
  otherCategoryName: string;
  resolveSectionAccent: (accentColor: string) => string;
  /** Evaluation instant for visibility scheduling. Defaults to now. */
  now?: Date;
}

export function buildPublicMenuGroups({
  sections,
  categories,
  items,
  otherCategoryName,
  resolveSectionAccent,
  now = new Date(),
}: BuildPublicMenuGroupsOptions): {
  dailySpecials: MenuItem[];
  groups: PublicMenuGroup[];
} {
  const categoriesBySectionId = new Map<string, Category[]>();
  let otherCategory: Category | undefined;

  for (const category of categories) {
    if (category.sectionId) {
      const sectionCategories = categoriesBySectionId.get(category.sectionId) ?? [];
      sectionCategories.push(category);
      categoriesBySectionId.set(category.sectionId, sectionCategories);
    }

    if (category.name.trim().toLocaleLowerCase() === otherCategoryName.toLocaleLowerCase()) {
      otherCategory ??= category;
    }
  }

  const dailySpecials: MenuItem[] = [];
  const itemsByCategoryId = new Map<string, MenuItem[]>();
  const uncategorizedItems: MenuItem[] = [];

  for (const item of items) {
    // Off-schedule items are absent from the public menu entirely — applied
    // before the specials branch so a scheduled-off item can't leak as a special.
    if (!isItemVisibleNow(item, now)) continue;

    if (item.isSpecialToday) {
      dailySpecials.push(item);
      continue;
    }

    if (!item.categoryId) {
      uncategorizedItems.push(item);
      continue;
    }

    const categoryItems = itemsByCategoryId.get(item.categoryId) ?? [];
    categoryItems.push(item);
    itemsByCategoryId.set(item.categoryId, categoryItems);
  }

  const groups: PublicMenuGroup[] = [];

  if (sections.length > 0) {
    for (const section of sections) {
      if (!section.isVisible) continue;

      for (const category of categoriesBySectionId.get(section.id) ?? []) {
        if (!category.isVisible) continue;

        const categoryItems = itemsByCategoryId.get(category.id) ?? [];
        if (categoryItems.length === 0) continue;

        groups.push({
          sectionId: section.id,
          sectionName: section.name,
          sectionAccent: resolveSectionAccent(section.accentColor),
          sectionCoverImageUrl: section.coverImageUrl,
          categoryId: category.id,
          categoryName: category.name,
          categoryCoverImageUrl: category.coverImageUrl,
          items: categoryItems,
        });
      }
    }
  } else {
    for (const category of categories) {
      if (!category.isVisible) continue;

      const categoryItems = itemsByCategoryId.get(category.id) ?? [];
      const mergedItems =
        otherCategory?.id === category.id
          ? [...categoryItems, ...uncategorizedItems]
          : categoryItems;
      if (mergedItems.length === 0) continue;

      groups.push({
        sectionId: null,
        sectionName: null,
        sectionAccent: null,
        sectionCoverImageUrl: null,
        categoryId: category.id,
        categoryName: category.name,
        categoryCoverImageUrl: category.coverImageUrl,
        items: mergedItems,
      });
    }

    if (!otherCategory && uncategorizedItems.length > 0) {
      groups.push({
        sectionId: null,
        sectionName: null,
        sectionAccent: null,
        sectionCoverImageUrl: null,
        categoryId: 'uncategorized',
        categoryName: otherCategoryName,
        categoryCoverImageUrl: null,
        items: uncategorizedItems,
      });
    }
  }

  return { dailySpecials, groups };
}
