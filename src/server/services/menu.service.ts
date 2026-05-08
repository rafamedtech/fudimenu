import 'server-only';
import { getMenuRepository } from '@/server/repositories/get-repository';
import type { MenuData } from '@/server/repositories/menu.repository';
import type { MenuItem, MenuSection, Category, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';

export const menuService = {
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return (await getMenuRepository()).getTenantBySlug(slug);
  },

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    return (await getMenuRepository()).getMenuByTenantId(tenantId);
  },

  async getItemsByTenantId(tenantId: string): Promise<MenuItem[]> {
    return (await getMenuRepository()).getItemsByTenantId(tenantId);
  },

  async toggleItemAvailability(
    tenantId: string,
    itemId: string,
    available: boolean,
  ): Promise<MenuItem> {
    return (await getMenuRepository()).toggleItemAvailability(tenantId, itemId, available);
  },

  async setItemSpecialToday(
    tenantId: string,
    itemId: string,
    isSpecialToday: boolean,
  ): Promise<MenuItem> {
    return (await getMenuRepository()).setItemSpecialToday(tenantId, itemId, isSpecialToday);
  },

  async softDeleteItem(tenantId: string, itemId: string): Promise<MenuItem> {
    return (await getMenuRepository()).softDeleteItem(tenantId, itemId);
  },

  async restoreItem(tenantId: string, itemId: string): Promise<MenuItem> {
    return (await getMenuRepository()).restoreItem(tenantId, itemId);
  },

  async upsertItem(tenantId: string, input: Partial<MenuItem>): Promise<MenuItem> {
    return (await getMenuRepository()).upsertItem(tenantId, input);
  },

  async upsertSection(tenantId: string, input: SectionInput): Promise<MenuSection> {
    return (await getMenuRepository()).upsertSection(tenantId, input);
  },

  async deleteSection(tenantId: string, sectionId: string): Promise<void> {
    return (await getMenuRepository()).deleteSection(tenantId, sectionId);
  },

  async reorderSections(tenantId: string, sectionIds: string[]): Promise<void> {
    return (await getMenuRepository()).reorderSections(tenantId, sectionIds);
  },

  async upsertCategory(tenantId: string, input: CategoryInput): Promise<Category> {
    return (await getMenuRepository()).upsertCategory(tenantId, input);
  },

  async deleteCategory(tenantId: string, categoryId: string): Promise<void> {
    return (await getMenuRepository()).deleteCategory(tenantId, categoryId);
  },

  async reorderCategories(
    tenantId: string,
    sectionId: string | null,
    categoryIds: string[],
  ): Promise<void> {
    return (await getMenuRepository()).reorderCategories(tenantId, sectionId, categoryIds);
  },
};
