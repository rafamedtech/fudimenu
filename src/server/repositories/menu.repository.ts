import 'server-only';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';

export type MenuData = {
  tenant: Tenant;
  sections: MenuSection[];
  categories: Category[];
  items: MenuItem[];
};

export interface IMenuRepository {
  getTenantBySlug(slug: string): Promise<Tenant | null>;
  getMenuByTenantId(id: string): Promise<MenuData>;
  getItemsByTenantId(id: string): Promise<MenuItem[]>;
  toggleItemAvailability(tenantId: string, itemId: string, available: boolean): Promise<MenuItem>;
  setItemSpecialToday(
    tenantId: string,
    itemId: string,
    isSpecialToday: boolean,
  ): Promise<MenuItem>;
  softDeleteItem(tenantId: string, itemId: string): Promise<MenuItem>;
  restoreItem(tenantId: string, itemId: string): Promise<MenuItem>;
  upsertItem(tenantId: string, input: Partial<MenuItem>): Promise<MenuItem>;
}
