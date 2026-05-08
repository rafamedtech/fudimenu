import 'server-only';
import { mockCategories, mockItems, mockSections, mockTenant } from '@/lib/mock/data';
import { sanitizePlainText } from '@/lib/sanitize';
import type { IMenuRepository, MenuData } from '@/server/repositories/menu.repository';
import type { Category, MenuItem, Tenant } from '@/types/domain';

function cloneTenant(tenant: Tenant): Tenant {
  return { ...tenant };
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

export class MockMenuRepository implements IMenuRepository {
  private readonly tenant = cloneTenant(mockTenant);
  private readonly categories = mockCategories.map(cloneCategory);
  private readonly items = mockItems.map(cloneMenuItem);

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return slug === this.tenant.slug ? cloneTenant(this.tenant) : null;
  }

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    if (tenantId !== this.tenant.id) throw new Error('not_found');

    return {
      tenant: cloneTenant(this.tenant),
      sections: mockSections.filter((s) => s.tenantId === tenantId).map((s) => ({ ...s })),
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
}
