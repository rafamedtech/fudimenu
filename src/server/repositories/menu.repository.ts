import 'server-only';
import type { Category, MenuItem, MenuSection, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';

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
  upsertSection(tenantId: string, input: SectionInput): Promise<MenuSection>;
  deleteSection(tenantId: string, sectionId: string): Promise<void>;
  reorderSections(tenantId: string, sectionIds: string[]): Promise<void>;
  upsertCategory(tenantId: string, input: CategoryInput): Promise<Category>;
  deleteCategory(tenantId: string, categoryId: string): Promise<void>;
  reorderCategories(tenantId: string, sectionId: string | null, categoryIds: string[]): Promise<void>;
}
