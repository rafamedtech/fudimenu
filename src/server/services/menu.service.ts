import 'server-only';
import { getMenuRepository } from '@/server/repositories/get-repository';
import type { MenuData } from '@/server/repositories/menu.repository';
import type { MenuItem, MenuSection, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';

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

  async upsertSection(_tenantId: string, _input: SectionInput): Promise<MenuSection> {
    throw new Error('not implemented');
  },

  async deleteSection(_tenantId: string, _sectionId: string): Promise<void> {
    throw new Error('not implemented');
  },

  async reorderSections(_tenantId: string, _sectionIds: string[]): Promise<void> {
    throw new Error('not implemented');
  },
};
