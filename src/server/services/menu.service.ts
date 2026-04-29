import 'server-only';
import { getMenuRepository } from '@/server/repositories/get-repository';
import type { MenuData } from '@/server/repositories/menu.repository';
import type { MenuItem, Tenant } from '@/types/domain';

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

  async upsertItem(tenantId: string, input: Partial<MenuItem>): Promise<MenuItem> {
    return (await getMenuRepository()).upsertItem(tenantId, input);
  },
};
