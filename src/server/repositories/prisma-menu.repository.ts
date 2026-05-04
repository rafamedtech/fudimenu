import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import type { MenuData, IMenuRepository } from '@/server/repositories/menu.repository';
import type { Category, MenuItem, Tenant } from '@/types/domain';

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  whatsappPhone: string | null;
  businessHours: string | null;
  primaryColor: string;
  cuisineType: string | null;
  defaultLocale: string;
  currency: string;
  plan: string;
  createdAt: Date;
};

type CategoryRow = {
  id: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
};

type MenuItemRow = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  priceCents: number;
  isSpecialToday?: boolean;
  specialPrice?: number | null;
  currency: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    whatsappPhone: row.whatsappPhone,
    businessHours: row.businessHours,
    primaryColor: row.primaryColor,
    cuisineType: row.cuisineType,
    defaultLocale: row.defaultLocale as Tenant['defaultLocale'],
    currency: row.currency,
    plan: row.plan as Tenant['plan'],
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

function mapMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    isSpecialToday: row.isSpecialToday ?? false,
    specialPrice: row.specialPrice ?? null,
    currency: row.currency,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export class PrismaMenuRepository implements IMenuRepository {
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const prisma = getPrisma();
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    return tenant ? mapTenant(tenant) : null;
  }

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    const prisma = getPrisma();
    const [tenant, categories, items] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.category.findMany({
        where: { tenantId, isVisible: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.menuItem.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    if (!tenant) throw new Error('not_found');

    return {
      tenant: mapTenant(tenant),
      categories: categories.map(mapCategory),
      items: items.map(mapMenuItem),
    };
  }

  async getItemsByTenantId(tenantId: string): Promise<MenuItem[]> {
    const prisma = getPrisma();
    const items = await prisma.menuItem.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return items.map(mapMenuItem);
  }

  async toggleItemAvailability(
    tenantId: string,
    itemId: string,
    available: boolean,
  ): Promise<MenuItem> {
    const prisma = getPrisma();
    const result = await prisma.menuItem.updateMany({
      where: { id: itemId, tenantId, deletedAt: null },
      data: { isAvailable: available },
    });

    if (result.count === 0) throw new Error('not_found');

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new Error('not_found');
    return mapMenuItem(item);
  }

  async setItemSpecialToday(
    tenantId: string,
    itemId: string,
    isSpecialToday: boolean,
  ): Promise<MenuItem> {
    const prisma = getPrisma();
    const result = await prisma.menuItem.updateMany({
      where: { id: itemId, tenantId, deletedAt: null },
      data: { isSpecialToday },
    });

    if (result.count === 0) throw new Error('not_found');

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new Error('not_found');
    return mapMenuItem(item);
  }

  async softDeleteItem(tenantId: string, itemId: string): Promise<MenuItem> {
    const prisma = getPrisma();
    const result = await prisma.menuItem.updateMany({
      where: { id: itemId, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    if (result.count === 0) throw new Error('not_found');

    const item = await prisma.menuItem.findFirst({ where: { id: itemId, tenantId } });
    if (!item) throw new Error('not_found');
    return mapMenuItem(item);
  }

  async restoreItem(tenantId: string, itemId: string): Promise<MenuItem> {
    const prisma = getPrisma();
    const result = await prisma.menuItem.updateMany({
      where: { id: itemId, tenantId },
      data: { deletedAt: null },
    });

    if (result.count === 0) throw new Error('not_found');

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, tenantId, deletedAt: null },
    });
    if (!item) throw new Error('not_found');
    return mapMenuItem(item);
  }

  async upsertItem(tenantId: string, input: Partial<MenuItem>): Promise<MenuItem> {
    const payload: {
      categoryId: string | null;
      name: string;
      description: string | null;
      priceCents: number;
      isSpecialToday?: boolean;
      specialPrice?: number | null;
      currency: string;
      imageUrl: string | null;
      isAvailable: boolean;
      sortOrder: number;
    } = {
      categoryId: input.categoryId ?? null,
      name: input.name ?? 'Sin nombre',
      description: normalizeText(input.description),
      priceCents: input.priceCents ?? 0,
      currency: input.currency ?? 'MXN',
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true,
      sortOrder: input.sortOrder ?? 999,
    };

    if (!input.id || 'isSpecialToday' in input) {
      payload.isSpecialToday = input.isSpecialToday ?? false;
    }

    if (!input.id || 'specialPrice' in input) {
      payload.specialPrice = input.specialPrice ?? null;
    }

    const prisma = getPrisma();

    if (input.id) {
      const result = await prisma.menuItem.updateMany({
        where: { id: input.id, tenantId, deletedAt: null },
        data: payload,
      });

      if (result.count === 0) throw new Error('not_found');

      const item = await prisma.menuItem.findFirst({
        where: { id: input.id, tenantId, deletedAt: null },
      });
      if (!item) throw new Error('not_found');
      return mapMenuItem(item);
    }

    const item = await prisma.menuItem.create({
      data: { ...payload, tenantId },
    });
    return mapMenuItem(item);
  }
}
