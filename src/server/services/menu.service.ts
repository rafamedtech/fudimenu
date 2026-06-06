import 'server-only';
import { unstable_cache } from 'next/cache';
import { getMenuRepository } from '@/server/repositories/get-repository';
import type { MenuData, ImportResult } from '@/server/repositories/menu.repository';
import type { ItemUpsertInput, MenuItem, MenuSection, Category, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';
import type { ImportItem } from '@/lib/validators/import.schema';

const MENU_CACHE_REVALIDATE_SECONDS = 300;
const TENANT_CACHE_REVALIDATE_SECONDS = 300;

function shouldBypassCache() {
  return process.env.USE_MOCKS === 'true' || process.env.NODE_ENV === 'test';
}

async function readTenantBySlug(slug: string): Promise<Tenant | null> {
  return (await getMenuRepository()).getTenantBySlug(slug);
}

async function readMenuByTenantId(tenantId: string): Promise<MenuData> {
  return (await getMenuRepository()).getMenuByTenantId(tenantId);
}

export const menuService = {
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return readTenantBySlug(slug);
  },

  async getCachedTenantBySlug(slug: string): Promise<Tenant | null> {
    if (shouldBypassCache()) return readTenantBySlug(slug);

    return unstable_cache(
      () => readTenantBySlug(slug),
      ['tenant-by-slug', slug],
      {
        revalidate: TENANT_CACHE_REVALIDATE_SECONDS,
        tags: [`tenant-slug:${slug}`],
      },
    )();
  },

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    return readMenuByTenantId(tenantId);
  },

  async getCachedMenuByTenantId(tenantId: string): Promise<MenuData> {
    if (shouldBypassCache()) return readMenuByTenantId(tenantId);

    return unstable_cache(
      () => readMenuByTenantId(tenantId),
      ['menu-by-tenant', tenantId],
      {
        revalidate: MENU_CACHE_REVALIDATE_SECONDS,
        tags: [`menu:${tenantId}`, `tenant:${tenantId}`],
      },
    )();
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

  async upsertItem(tenantId: string, input: ItemUpsertInput): Promise<MenuItem> {
    return (await getMenuRepository()).upsertItem(tenantId, input);
  },

  async getImageLibrary(tenantId: string): Promise<string[]> {
    return (await getMenuRepository()).getImageLibrary(tenantId);
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

  async importMenu(tenantId: string, items: ImportItem[]): Promise<ImportResult> {
    return (await getMenuRepository()).importMenu(tenantId, items);
  },
};
