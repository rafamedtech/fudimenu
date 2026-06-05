import 'server-only';
import { mockCategories, mockItems, mockSections, mockTenant } from '@/lib/mock/data';
import { sanitizePlainText } from '@/lib/sanitize';
import { normalizeAllergenTags, normalizeDietaryTags } from '@/lib/item-attributes';
import type { IMenuRepository, MenuData, ImportResult } from '@/server/repositories/menu.repository';
import type { Category, ItemTranslation, ItemUpsertInput, MenuItem, MenuSection, Tenant, VisibilityScheduleFields } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';
import type { ImportItem } from '@/lib/validators/import.schema';

// Full-replace schedule fields from upsert input (sections/categories editor
// always sends the whole schedule; items pass only when present via spread).
function mockSchedule(input: Partial<VisibilityScheduleFields>): VisibilityScheduleFields {
  return {
    scheduleDays: input.scheduleDays ?? [],
    scheduleStartMinute: input.scheduleStartMinute ?? null,
    scheduleEndMinute: input.scheduleEndMinute ?? null,
    scheduleStartDate: input.scheduleStartDate ?? null,
    scheduleEndDate: input.scheduleEndDate ?? null,
  };
}

function cloneTenant(tenant: Tenant): Tenant {
  return { ...tenant };
}

function cloneSection(section: MenuSection): MenuSection {
  return { ...section, scheduleDays: [...section.scheduleDays] };
}

function cloneCategory(category: Category): Category {
  return { ...category, scheduleDays: [...category.scheduleDays] };
}

function cloneMenuItem(item: MenuItem): MenuItem {
  return {
    ...item,
    dietaryTags: [...(item.dietaryTags ?? [])],
    allergenTags: [...(item.allergenTags ?? [])],
    scheduleDays: [...(item.scheduleDays ?? [])],
    translations: item.translations?.map((translation) => ({ ...translation })),
    variants: item.variants?.map((variant) => ({ ...variant })),
  };
}

/** Replace an item's variants from upsert input; array order → sortOrder. */
function buildMockVariants(input: ItemUpsertInput['variants']): MenuItem['variants'] {
  return (input ?? []).map((variant, index) => ({
    id: `var_${crypto.randomUUID().slice(0, 8)}`,
    name: sanitizePlainText(variant.name, 60) ?? 'Opción',
    priceCents: variant.priceCents,
    sortOrder: index,
  }));
}

/**
 * Apply translation edits onto an item's translation list. Empty entries
 * (name and description both blank) are dropped so reads fall back to the
 * base locale — mirrors the soft-delete in the Prisma repository.
 */
function applyMockTranslations(
  existing: ItemTranslation[] | undefined,
  itemId: string,
  edits: NonNullable<ItemUpsertInput['translations']>,
): ItemTranslation[] {
  const byLocale = new Map((existing ?? []).map((t) => [t.locale, { ...t, itemId }]));

  for (const edit of edits) {
    const name = sanitizePlainText(edit.name, 80);
    const description = sanitizePlainText(edit.description, 500);

    if (name === null && description === null) {
      byLocale.delete(edit.locale);
      continue;
    }

    byLocale.set(edit.locale, { itemId, locale: edit.locale, name, description });
  }

  return [...byLocale.values()];
}

function isActive(item: MenuItem) {
  return !item.deletedAt;
}

function isActiveSection(section: MenuSection) {
  return section.isVisible && !section.deletedAt;
}

export class MockMenuRepository implements IMenuRepository {
  private readonly tenant = cloneTenant(mockTenant);
  private readonly sections = mockSections.map(cloneSection);
  private readonly categories = mockCategories.map(cloneCategory);
  private readonly items = mockItems.map(cloneMenuItem);

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return slug === this.tenant.slug ? cloneTenant(this.tenant) : null;
  }

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    if (tenantId !== this.tenant.id) throw new Error('not_found');

    return {
      tenant: cloneTenant(this.tenant),
      sections: this.sections
        .filter((s) => s.tenantId === tenantId && isActiveSection(s))
        .map(cloneSection),
      categories: this.categories.map(cloneCategory),
      items: this.items
        .filter((item) => item.tenantId === tenantId && isActive(item))
        .map(cloneMenuItem),
    };
  }

  async getItemsByTenantId(tenantId: string): Promise<MenuItem[]> {
    return this.items
      .filter((item) => item.tenantId === tenantId && isActive(item))
      .map(cloneMenuItem);
  }

  async toggleItemAvailability(
    tenantId: string,
    itemId: string,
    available: boolean,
  ): Promise<MenuItem> {
    const idx = this.items.findIndex(
      (item) => item.id === itemId && item.tenantId === tenantId && isActive(item),
    );
    if (idx < 0) throw new Error('not_found');

    this.items[idx] = {
      ...this.items[idx],
      isAvailable: available,
      updatedAt: new Date().toISOString(),
    };
    return cloneMenuItem(this.items[idx]);
  }

  async setItemSpecialToday(
    tenantId: string,
    itemId: string,
    isSpecialToday: boolean,
  ): Promise<MenuItem> {
    const idx = this.items.findIndex(
      (item) => item.id === itemId && item.tenantId === tenantId && isActive(item),
    );
    if (idx < 0) throw new Error('not_found');

    this.items[idx] = {
      ...this.items[idx],
      isSpecialToday,
      updatedAt: new Date().toISOString(),
    };
    return cloneMenuItem(this.items[idx]);
  }

  async softDeleteItem(tenantId: string, itemId: string): Promise<MenuItem> {
    const idx = this.items.findIndex(
      (item) => item.id === itemId && item.tenantId === tenantId && isActive(item),
    );
    if (idx < 0) throw new Error('not_found');

    const now = new Date().toISOString();
    this.items[idx] = {
      ...this.items[idx],
      deletedAt: now,
      updatedAt: now,
    };
    return cloneMenuItem(this.items[idx]);
  }

  async restoreItem(tenantId: string, itemId: string): Promise<MenuItem> {
    const idx = this.items.findIndex((item) => item.id === itemId && item.tenantId === tenantId);
    if (idx < 0) throw new Error('not_found');

    this.items[idx] = {
      ...this.items[idx],
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };
    return cloneMenuItem(this.items[idx]);
  }

  async upsertItem(tenantId: string, input: ItemUpsertInput): Promise<MenuItem> {
    const { translations: _translations, variants: _variants, ...rest } = input;
    const sanitizedInput = {
      ...rest,
      name: sanitizePlainText(input.name, 80) ?? 'Sin nombre',
      description: sanitizePlainText(input.description, 500),
      // Only normalize when the caller actually sent the field, so partial
      // updates don't wipe existing tags (mirrors the Prisma repo).
      ...('dietaryTags' in input
        ? { dietaryTags: normalizeDietaryTags(input.dietaryTags ?? []) }
        : {}),
      ...('allergenTags' in input
        ? { allergenTags: normalizeAllergenTags(input.allergenTags ?? []) }
        : {}),
      // Variants are fully owned by the item: replace only when sent, so a
      // partial update never wipes them (mirrors the Prisma repo).
      ...('variants' in input ? { variants: buildMockVariants(input.variants) } : {}),
    };

    if (input.id) {
      const idx = this.items.findIndex(
        (item) => item.id === input.id && item.tenantId === tenantId && isActive(item),
      );
      if (idx >= 0) {
        this.items[idx] = {
          ...this.items[idx],
          ...sanitizedInput,
          tenantId,
          translations: input.translations
            ? applyMockTranslations(this.items[idx].translations, input.id, input.translations)
            : this.items[idx].translations,
          updatedAt: new Date().toISOString(),
        };
        return cloneMenuItem(this.items[idx]);
      }
    }

    const now = new Date().toISOString();
    const id = `itm_${crypto.randomUUID().slice(0, 8)}`;
    const created: MenuItem = {
      id,
      tenantId,
      categoryId: sanitizedInput.categoryId ?? null,
      name: sanitizedInput.name,
      description: sanitizedInput.description,
      priceCents: input.priceCents ?? 0,
      isSpecialToday: input.isSpecialToday ?? false,
      specialPrice: input.specialPrice ?? null,
      currency: input.currency ?? 'MXN',
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true,
      dietaryTags: normalizeDietaryTags(input.dietaryTags ?? []),
      allergenTags: normalizeAllergenTags(input.allergenTags ?? []),
      ...mockSchedule(input),
      sortOrder: input.sortOrder ?? 999,
      createdAt: now,
      updatedAt: now,
      translations: input.translations
        ? applyMockTranslations(undefined, id, input.translations)
        : undefined,
      variants: 'variants' in input ? buildMockVariants(input.variants) : undefined,
    };
    this.items.push(created);
    return cloneMenuItem(created);
  }

  async upsertSection(tenantId: string, input: SectionInput): Promise<MenuSection> {
    if (input.id) {
      const idx = this.sections.findIndex(
        (s) => s.id === input.id && s.tenantId === tenantId && !s.deletedAt,
      );
      if (idx < 0) throw new Error('not_found');
      this.sections[idx] = {
        ...this.sections[idx],
        name: input.name,
        coverImageUrl: input.coverImageUrl ?? null,
        accentColor: input.accentColor,
        sortOrder: input.sortOrder,
        isVisible: input.isVisible,
        ...mockSchedule(input),
        updatedAt: new Date().toISOString(),
      };
      return cloneSection(this.sections[idx]);
    }

    const created: MenuSection = {
      id: `sec_${crypto.randomUUID().slice(0, 8)}`,
      tenantId,
      name: input.name,
      coverImageUrl: input.coverImageUrl ?? null,
      accentColor: input.accentColor,
      sortOrder: input.sortOrder,
      isVisible: input.isVisible,
      ...mockSchedule(input),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.sections.push(created);
    return cloneSection(created);
  }

  async deleteSection(tenantId: string, sectionId: string): Promise<void> {
    const idx = this.sections.findIndex(
      (s) => s.id === sectionId && s.tenantId === tenantId && !s.deletedAt,
    );
    if (idx < 0) throw new Error('not_found');
    const now = new Date().toISOString();
    this.sections[idx] = { ...this.sections[idx], isVisible: false, deletedAt: now, updatedAt: now };
  }

  async reorderSections(tenantId: string, sectionIds: string[]): Promise<void> {
    sectionIds.forEach((id, index) => {
      const idx = this.sections.findIndex(
        (s) => s.id === id && s.tenantId === tenantId && !s.deletedAt,
      );
      if (idx >= 0) {
        this.sections[idx] = {
          ...this.sections[idx],
          sortOrder: index,
          updatedAt: new Date().toISOString(),
        };
      }
    });
  }

  async upsertCategory(tenantId: string, input: CategoryInput): Promise<Category> {
    const name = sanitizePlainText(input.name, 40) ?? input.name;

    if (input.id) {
      const idx = this.categories.findIndex(
        (c) => c.id === input.id && c.tenantId === tenantId,
      );
      if (idx < 0) throw new Error('not_found');
      this.categories[idx] = {
        ...this.categories[idx],
        name,
        coverImageUrl: input.coverImageUrl ?? null,
        sectionId: input.sectionId ?? null,
        sortOrder: input.sortOrder ?? 0,
        isVisible: input.isVisible ?? true,
        ...mockSchedule(input),
      };
      return cloneCategory(this.categories[idx]);
    }

    const created: Category = {
      id: `cat_${crypto.randomUUID().slice(0, 8)}`,
      tenantId,
      sectionId: input.sectionId ?? null,
      name,
      coverImageUrl: input.coverImageUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
      isVisible: input.isVisible ?? true,
      ...mockSchedule(input),
    };
    this.categories.push(created);
    return cloneCategory(created);
  }

  async deleteCategory(tenantId: string, categoryId: string): Promise<void> {
    const idx = this.categories.findIndex((c) => c.id === categoryId && c.tenantId === tenantId);
    if (idx < 0) throw new Error('not_found');

    this.categories.splice(idx, 1);
    this.items.forEach((item, itemIndex) => {
      if (item.tenantId === tenantId && item.categoryId === categoryId) {
        this.items[itemIndex] = {
          ...item,
          categoryId: null,
          updatedAt: new Date().toISOString(),
        };
      }
    });
  }

  async reorderCategories(
    tenantId: string,
    sectionId: string | null,
    categoryIds: string[],
  ): Promise<void> {
    categoryIds.forEach((id, index) => {
      const idx = this.categories.findIndex(
        (c) => c.id === id && c.tenantId === tenantId && (c.sectionId ?? null) === sectionId,
      );
      if (idx >= 0) this.categories[idx] = { ...this.categories[idx], sortOrder: index };
    });
  }

  async importMenu(tenantId: string, items: ImportItem[]): Promise<ImportResult> {
    const rows = items.map((item) => ({
      name: sanitizePlainText(item.name, 80) ?? 'Sin nombre',
      description: sanitizePlainText(item.description, 500),
      priceCents: item.priceCents,
      categoryName: sanitizePlainText(item.categoryName, 40),
      sectionName: sanitizePlainText(item.sectionName, 40),
    }));

    const sectionIdByName = new Map(
      this.sections.filter((s) => s.tenantId === tenantId && !s.deletedAt).map((s) => [s.name, s.id]),
    );
    const categoryIdByName = new Map(
      this.categories.filter((c) => c.tenantId === tenantId).map((c) => [c.name, c.id]),
    );

    let sectionsCreated = 0;
    let categoriesCreated = 0;

    for (const row of rows) {
      if (!row.sectionName || sectionIdByName.has(row.sectionName)) continue;
      const created = await this.upsertSection(tenantId, {
        name: row.sectionName,
        accentColor: '#FFF8E7',
        sortOrder: sectionIdByName.size,
        isVisible: true,
      });
      sectionIdByName.set(row.sectionName, created.id);
      sectionsCreated++;
    }

    for (const row of rows) {
      if (!row.categoryName || categoryIdByName.has(row.categoryName)) continue;
      const sectionId = row.sectionName ? sectionIdByName.get(row.sectionName) ?? null : null;
      const created = await this.upsertCategory(tenantId, {
        name: row.categoryName,
        sectionId,
        sortOrder: categoryIdByName.size,
        isVisible: true,
      });
      categoryIdByName.set(row.categoryName, created.id);
      categoriesCreated++;
    }

    const maxSortOrder = this.items
      .filter((item) => item.tenantId === tenantId && isActive(item))
      .reduce((max, item) => Math.max(max, item.sortOrder), -1);

    let itemsCreated = 0;
    for (const [index, row] of rows.entries()) {
      await this.upsertItem(tenantId, {
        categoryId: row.categoryName ? categoryIdByName.get(row.categoryName) ?? null : null,
        name: row.name,
        description: row.description,
        priceCents: row.priceCents,
        currency: 'MXN',
        sortOrder: maxSortOrder + 1 + index,
      });
      itemsCreated++;
    }

    return { itemsCreated, categoriesCreated, sectionsCreated };
  }
}
