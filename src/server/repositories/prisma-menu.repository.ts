import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { sanitizePlainText } from '@/lib/sanitize';
import { normalizeAllergenTags, normalizeDietaryTags } from '@/lib/item-attributes';
import { dedupeImageUrls } from '@/lib/image-library';
import { isItemImageCrop } from '@/lib/cloudinary';
import type { MenuData, IMenuRepository, ImportResult } from '@/server/repositories/menu.repository';
import type { Category, ItemTranslation, ItemUpsertInput, MenuItem, MenuSection, Tenant } from '@/types/domain';
import type { SectionInput } from '@/lib/validators/section.schema';
import type { CategoryInput } from '@/lib/validators/item.schema';
import type { ImportItem } from '@/lib/validators/import.schema';

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  logoShape: string;
  whatsappPhone: string | null;
  businessHours: string | null;
  primaryColor: string;
  cuisineType: string | null;
  defaultLocale: string;
  currency: string;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
};

type SectionRow = {
  id: string;
  tenantId: string;
  name: string;
  coverImageUrl: string | null;
  accentColor: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type CategoryRow = {
  id: string;
  tenantId: string;
  sectionId: string | null;
  name: string;
  coverImageUrl: string | null;
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
  imageAltText: string | null;
  imageCrop: string | null;
  isAvailable: boolean;
  dietaryTags: string[];
  allergenTags: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  translations?: ItemTranslationRow[];
};

type ItemTranslationRow = {
  itemId: string;
  locale: string;
  name: string | null;
  description: string | null;
};

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    coverImageUrl: row.coverImageUrl,
    logoShape: row.logoShape as Tenant['logoShape'],
    whatsappPhone: row.whatsappPhone,
    businessHours: row.businessHours,
    primaryColor: row.primaryColor,
    cuisineType: row.cuisineType,
    defaultLocale: row.defaultLocale as Tenant['defaultLocale'],
    currency: row.currency,
    plan: row.plan as Tenant['plan'],
    stripeCustomerId: row.stripeCustomerId,
    stripeSubscriptionId: row.stripeSubscriptionId,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapSection(row: SectionRow): MenuSection {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    coverImageUrl: row.coverImageUrl,
    accentColor: row.accentColor,
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    tenantId: row.tenantId,
    sectionId: row.sectionId ?? null,
    name: row.name,
    coverImageUrl: row.coverImageUrl,
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
    imageAltText: row.imageAltText ?? null,
    imageCrop: row.imageCrop ?? null,
    isAvailable: row.isAvailable,
    dietaryTags: row.dietaryTags ?? [],
    allergenTags: row.allergenTags ?? [],
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    translations: row.translations?.map(mapItemTranslation),
  };
}

function mapItemTranslation(row: ItemTranslationRow): ItemTranslation {
  return {
    itemId: row.itemId,
    locale: row.locale as ItemTranslation['locale'],
    name: row.name,
    description: row.description,
  };
}

export class PrismaMenuRepository implements IMenuRepository {
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const prisma = getPrisma();
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    return tenant ? mapTenant(tenant) : null;
  }

  async getMenuByTenantId(tenantId: string): Promise<MenuData> {
    const prisma = getPrisma();
    const [tenant, sections, categories, items] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.menuSection.findMany({
        where: { tenantId, isVisible: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.category.findMany({
        where: { tenantId, isVisible: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.menuItem.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        include: { translations: { where: { deletedAt: null } } },
      }),
    ]);

    if (!tenant) throw new Error('not_found');

    return {
      tenant: mapTenant(tenant),
      sections: sections.map(mapSection),
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

  async getImageLibrary(tenantId: string): Promise<string[]> {
    const prisma = getPrisma();
    const [tenant, sections, categories, items] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { logoUrl: true, coverImageUrl: true },
      }),
      prisma.menuSection.findMany({
        where: { tenantId, deletedAt: null },
        select: { coverImageUrl: true },
      }),
      prisma.category.findMany({
        where: { tenantId, deletedAt: null },
        select: { coverImageUrl: true },
      }),
      prisma.menuItem.findMany({
        where: { tenantId, deletedAt: null },
        select: { imageUrl: true },
      }),
    ]);

    return dedupeImageUrls([
      tenant?.logoUrl,
      tenant?.coverImageUrl,
      ...sections.map((s) => s.coverImageUrl),
      ...categories.map((c) => c.coverImageUrl),
      ...items.map((i) => i.imageUrl),
    ]);
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

  async upsertItem(tenantId: string, input: ItemUpsertInput): Promise<MenuItem> {
    const payload: {
      categoryId: string | null;
      name: string;
      description: string | null;
      priceCents: number;
      isSpecialToday?: boolean;
      specialPrice?: number | null;
      currency: string;
      imageUrl: string | null;
      imageAltText?: string | null;
      imageCrop?: string | null;
      isAvailable?: boolean;
      dietaryTags?: string[];
      allergenTags?: string[];
      sortOrder: number;
    } = {
      categoryId: input.categoryId ?? null,
      name: sanitizePlainText(input.name, 80) ?? 'Sin nombre',
      description: sanitizePlainText(input.description, 500),
      priceCents: input.priceCents ?? 0,
      currency: input.currency ?? 'MXN',
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? 999,
    };

    if (!input.id || 'isAvailable' in input) {
      payload.isAvailable = input.isAvailable ?? true;
    }

    // Editorial metadata only persists when the image itself is part of this
    // write, so a partial update never silently strips alt/crop. Clearing the
    // image clears its metadata too.
    if (!input.id || 'imageUrl' in input) {
      const hasImage = (input.imageUrl ?? null) !== null;
      payload.imageAltText = hasImage
        ? sanitizePlainText(input.imageAltText, 125)
        : null;
      payload.imageCrop = hasImage && isItemImageCrop(input.imageCrop) ? input.imageCrop : null;
    }

    // Normalize defensively at the persistence boundary so the DB only ever
    // holds allowlisted values, regardless of caller.
    if (!input.id || 'dietaryTags' in input) {
      payload.dietaryTags = normalizeDietaryTags(input.dietaryTags ?? []);
    }

    if (!input.id || 'allergenTags' in input) {
      payload.allergenTags = normalizeAllergenTags(input.allergenTags ?? []);
    }

    if (!input.id || 'isSpecialToday' in input) {
      payload.isSpecialToday = input.isSpecialToday ?? false;
    }

    if (!input.id || 'specialPrice' in input) {
      payload.specialPrice = input.specialPrice ?? null;
    }

    const prisma = getPrisma();

    return prisma.$transaction(async (tx) => {
      let itemId: string;

      if (input.id) {
        const result = await tx.menuItem.updateMany({
          where: { id: input.id, tenantId, deletedAt: null },
          data: payload,
        });
        if (result.count === 0) throw new Error('not_found');
        itemId = input.id;
      } else {
        const created = await tx.menuItem.create({ data: { ...payload, tenantId } });
        itemId = created.id;
      }

      for (const translation of input.translations ?? []) {
        const name = sanitizePlainText(translation.name, 80);
        const description = sanitizePlainText(translation.description, 500);

        // Empty translation → soft-delete so the public read (deletedAt: null)
        // falls back to the base locale instead of showing a blank override.
        if (name === null && description === null) {
          await tx.itemTranslation.updateMany({
            where: { itemId, locale: translation.locale, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          continue;
        }

        await tx.itemTranslation.upsert({
          where: { itemId_locale: { itemId, locale: translation.locale } },
          create: { itemId, locale: translation.locale, name, description },
          update: { name, description, deletedAt: null },
        });
      }

      const item = await tx.menuItem.findFirst({
        where: { id: itemId, tenantId, deletedAt: null },
        include: { translations: { where: { deletedAt: null } } },
      });
      if (!item) throw new Error('not_found');
      return mapMenuItem(item);
    });
  }

  async upsertSection(tenantId: string, input: SectionInput): Promise<MenuSection> {
    const prisma = getPrisma();

    if (input.id) {
      const result = await prisma.menuSection.updateMany({
        where: { id: input.id, tenantId, deletedAt: null },
        data: {
          name: input.name,
          coverImageUrl: input.coverImageUrl ?? null,
          accentColor: input.accentColor,
          sortOrder: input.sortOrder,
          isVisible: input.isVisible,
        },
      });
      if (result.count === 0) throw new Error('not_found');

      const row = await prisma.menuSection.findFirst({
        where: { id: input.id, tenantId, deletedAt: null },
      });
      if (!row) throw new Error('not_found');
      return mapSection(row);
    }

    const row = await prisma.menuSection.create({
      data: {
        tenantId,
        name: input.name,
        coverImageUrl: input.coverImageUrl ?? null,
        accentColor: input.accentColor,
        sortOrder: input.sortOrder,
        isVisible: input.isVisible,
      },
    });
    return mapSection(row);
  }

  async deleteSection(tenantId: string, sectionId: string): Promise<void> {
    const prisma = getPrisma();
    const result = await prisma.menuSection.updateMany({
      where: { id: sectionId, tenantId, deletedAt: null },
      data: { isVisible: false, deletedAt: new Date() },
    });
    if (result.count === 0) throw new Error('not_found');
  }

  async reorderSections(tenantId: string, sectionIds: string[]): Promise<void> {
    const prisma = getPrisma();
    await prisma.$transaction(
      sectionIds.map((id, index) =>
        prisma.menuSection.updateMany({
          where: { id, tenantId, deletedAt: null },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async upsertCategory(tenantId: string, input: CategoryInput): Promise<Category> {
    const prisma = getPrisma();
    const name = sanitizePlainText(input.name, 40) ?? input.name;

    if (input.id) {
      const result = await prisma.category.updateMany({
        where: { id: input.id, tenantId, deletedAt: null },
        data: {
          name,
          coverImageUrl: input.coverImageUrl ?? null,
          sectionId: input.sectionId ?? null,
          sortOrder: input.sortOrder ?? 0,
          isVisible: input.isVisible ?? true,
        },
      });
      if (result.count === 0) throw new Error('not_found');

      const row = await prisma.category.findFirst({
        where: { id: input.id, tenantId, deletedAt: null },
      });
      if (!row) throw new Error('not_found');
      return mapCategory(row);
    }

    const row = await prisma.category.create({
      data: {
        tenantId,
        name,
        coverImageUrl: input.coverImageUrl ?? null,
        sectionId: input.sectionId ?? null,
        sortOrder: input.sortOrder ?? 0,
        isVisible: input.isVisible ?? true,
      },
    });
    return mapCategory(row);
  }

  async deleteCategory(tenantId: string, categoryId: string): Promise<void> {
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.category.updateMany({
        where: { id: categoryId, tenantId, deletedAt: null },
        data: { deletedAt: new Date(), isVisible: false },
      });

      if (deleted.count === 0) return deleted;

      await tx.menuItem.updateMany({
        where: { tenantId, categoryId, deletedAt: null },
        data: { categoryId: null },
      });

      return deleted;
    });

    if (result.count === 0) throw new Error('not_found');
  }

  async reorderCategories(
    tenantId: string,
    sectionId: string | null,
    categoryIds: string[],
  ): Promise<void> {
    const prisma = getPrisma();
    await prisma.$transaction(
      categoryIds.map((id, index) =>
        prisma.category.updateMany({
          where: { id, tenantId, sectionId, deletedAt: null },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async importMenu(tenantId: string, items: ImportItem[]): Promise<ImportResult> {
    const prisma = getPrisma();

    // Sanitize names up front so dedup matches already-stored (sanitized) rows.
    const rows = items.map((item) => ({
      name: sanitizePlainText(item.name, 80) ?? 'Sin nombre',
      description: sanitizePlainText(item.description, 500),
      priceCents: item.priceCents,
      categoryName: sanitizePlainText(item.categoryName, 40),
      sectionName: sanitizePlainText(item.sectionName, 40),
    }));

    return prisma.$transaction(async (tx) => {
      const [existingSections, existingCategories, maxItem] = await Promise.all([
        tx.menuSection.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, name: true },
        }),
        tx.category.findMany({
          where: { tenantId, deletedAt: null },
          select: { id: true, name: true },
        }),
        tx.menuItem.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: { sortOrder: 'desc' },
          take: 1,
          select: { sortOrder: true },
        }),
      ]);

      const sectionIdByName = new Map(existingSections.map((s) => [s.name, s.id]));
      const categoryIdByName = new Map(existingCategories.map((c) => [c.name, c.id]));

      let sectionsCreated = 0;
      let categoriesCreated = 0;

      // Create missing sections (preserve first-seen order).
      for (const row of rows) {
        if (!row.sectionName || sectionIdByName.has(row.sectionName)) continue;
        const created = await tx.menuSection.create({
          data: { tenantId, name: row.sectionName, sortOrder: existingSections.length + sectionsCreated },
        });
        sectionIdByName.set(row.sectionName, created.id);
        sectionsCreated++;
      }

      // Create missing categories, linking to the section of their first occurrence.
      for (const row of rows) {
        if (!row.categoryName || categoryIdByName.has(row.categoryName)) continue;
        const sectionId = row.sectionName ? sectionIdByName.get(row.sectionName) ?? null : null;
        const created = await tx.category.create({
          data: {
            tenantId,
            name: row.categoryName,
            sectionId,
            sortOrder: existingCategories.length + categoriesCreated,
          },
        });
        categoryIdByName.set(row.categoryName, created.id);
        categoriesCreated++;
      }

      const baseSortOrder = (maxItem[0]?.sortOrder ?? -1) + 1;
      const created = await tx.menuItem.createMany({
        data: rows.map((row, index) => ({
          tenantId,
          categoryId: row.categoryName ? categoryIdByName.get(row.categoryName) ?? null : null,
          name: row.name,
          description: row.description,
          priceCents: row.priceCents,
          currency: 'MXN',
          sortOrder: baseSortOrder + index,
        })),
      });

      return {
        itemsCreated: created.count,
        categoriesCreated,
        sectionsCreated,
      };
    });
  }
}
