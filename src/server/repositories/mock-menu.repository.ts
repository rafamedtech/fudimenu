import 'server-only';
import { mockCategories, mockItems, mockSections, mockTenant } from '@/lib/mock/data';
import { sanitizePlainText } from '@/lib/sanitize';
import type { IMenuRepository, MenuData } from '@/server/repositories/menu.repository';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';

function cloneTenant(tenant: Tenant): Tenant {
  return { ...tenant };
}

function cloneSection(section: MenuSection): MenuSection {
  return { ...section };
}

function cloneCategory(category: Category): Category {
  return { ...category };
}

function cloneMenuItem(item: MenuItem): MenuItem {
  return { ...item };
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

  async upsertItem(tenantId: string, input: Partial<MenuItem>): Promise<MenuItem> {
    const sanitizedInput = {
      ...input,
      name: sanitizePlainText(input.name, 80) ?? 'Sin nombre',
      description: sanitizePlainText(input.description, 500),
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
          updatedAt: new Date().toISOString(),
        };
        return cloneMenuItem(this.items[idx]);
      }
    }

    const now = new Date().toISOString();
    const created: MenuItem = {
      id: `itm_${crypto.randomUUID().slice(0, 8)}`,
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
      sortOrder: input.sortOrder ?? 999,
      createdAt: now,
      updatedAt: now,
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
}
