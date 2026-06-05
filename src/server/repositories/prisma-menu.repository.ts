import 'server-only';
import { getPrisma } from '@/lib/db/prisma';
import { sanitizePlainText } from '@/lib/sanitize';
import { normalizeAllergenTags, normalizeDietaryTags } from '@/lib/item-attributes';
import type { MenuData, IMenuRepository, ImportResult } from '@/server/repositories/menu.repository';
import type { Category, ItemTranslation, ItemUpsertInput, ItemVariant, MenuItem, MenuSection, Tenant, VisibilityScheduleFields } from '@/types/domain';
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
  timezone: string | null;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
};

// Raw schedule columns as Prisma returns them (DATE → Date at UTC midnight).
type ScheduleRow = {
  scheduleDays?: number[] | null;
  scheduleStartMinute?: number | null;
  scheduleEndMinute?: number | null;
  scheduleStartDate?: Date | null;
  scheduleEndDate?: Date | null;
};

function dateToIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function isoToDate(s: string | null | undefined): Date | null {
  return s ? new Date(`${s}T00:00:00.000Z`) : null;
}

function mapSchedule(row: ScheduleRow): VisibilityScheduleFields {
  return {
    scheduleDays: row.scheduleDays ?? [],
    scheduleStartMinute: row.scheduleStartMinute ?? null,
    scheduleEndMinute: row.scheduleEndMinute ?? null,
    scheduleStartDate: dateToIso(row.scheduleStartDate),
    scheduleEndDate: dateToIso(row.scheduleEndDate),
  };
}

// Full-replace schedule payload for entities whose editor always sends the
// whole schedule (sections + categories). Items use a partial guard instead.
function scheduleWriteData(input: Partial<VisibilityScheduleFields>) {
  return {
    scheduleDays: input.scheduleDays ?? [],
    scheduleStartMinute: input.scheduleStartMinute ?? null,
    scheduleEndMinute: input.scheduleEndMinute ?? null,
    scheduleStartDate: isoToDate(input.scheduleStartDate),
    scheduleEndDate: isoToDate(input.scheduleEndDate),
  };
}

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
} & ScheduleRow;

type CategoryRow = {
  id: string;
  tenantId: string;
  sectionId: string | null;
  name: string;
  coverImageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
} & ScheduleRow;

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
  dietaryTags: string[];
  allergenTags: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  translations?: ItemTranslationRow[];
  variants?: ItemVariantRow[];
} & ScheduleRow;

type ItemTranslationRow = {
  itemId: string;
  locale: string;
  name: string | null;
  description: string | null;
};

type ItemVariantRow = {
  id: string;
  name: string;
  priceCents: number;
  sortOrder: number;
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
    timezone: row.timezone ?? null,
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
    ...mapSchedule(row),
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
    ...mapSchedule(row),
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
    dietaryTags: row.dietaryTags ?? [],
    allergenTags: row.allergenTags ?? [],
    ...mapSchedule(row),
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    translations: row.translations?.map(mapItemTranslation),
    variants: row.variants?.map(mapItemVariant),
  };
}

function mapItemVariant(row: ItemVariantRow): ItemVariant {
  return {
    id: row.id,
    name: row.name,
    priceCents: row.priceCents,
    sortOrder: row.sortOrder,
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
        include: {
          translations: { where: { deletedAt: null } },
          variants: { orderBy: { sortOrder: 'asc' } },
        },
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
      include: {
        translations: { where: { deletedAt: null } },
        variants: { orderBy: { sortOrder: 'asc' } },
      },
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
      isAvailable?: boolean;
      dietaryTags?: string[];
      allergenTags?: string[];
      scheduleDays?: number[];
      scheduleStartMinute?: number | null;
      scheduleEndMinute?: number | null;
      scheduleStartDate?: Date | null;
      scheduleEndDate?: Date | null;
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

    // Schedule fields: only touch when sent, so partial updates (e.g. stock
    // toggle) never wipe an existing window. Each is independent.
    if (!input.id || 'scheduleDays' in input) {
      payload.scheduleDays = input.scheduleDays ?? [];
    }

    if (!input.id || 'scheduleStartMinute' in input) {
      payload.scheduleStartMinute = input.scheduleStartMinute ?? null;
    }

    if (!input.id || 'scheduleEndMinute' in input) {
      payload.scheduleEndMinute = input.scheduleEndMinute ?? null;
    }

    if (!input.id || 'scheduleStartDate' in input) {
      payload.scheduleStartDate = isoToDate(input.scheduleStartDate);
    }

    if (!input.id || 'scheduleEndDate' in input) {
      payload.scheduleEndDate = isoToDate(input.scheduleEndDate);
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

      // Variants are fully owned by the item: only touch them when the caller
      // actually sent the field (so a partial update — e.g. stock toggle — never
      // wipes them). Then replace the whole set; array order becomes sortOrder.
      if (!input.id || 'variants' in input) {
        await tx.itemVariant.deleteMany({ where: { itemId, tenantId } });
        const variants = input.variants ?? [];
        if (variants.length > 0) {
          await tx.itemVariant.createMany({
            data: variants.map((variant, index) => ({
              tenantId,
              itemId,
              name: sanitizePlainText(variant.name, 60) ?? 'Opción',
              priceCents: variant.priceCents,
              sortOrder: index,
            })),
          });
        }
      }

      const item = await tx.menuItem.findFirst({
        where: { id: itemId, tenantId, deletedAt: null },
        include: {
          translations: { where: { deletedAt: null } },
          variants: { orderBy: { sortOrder: 'asc' } },
        },
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
          ...scheduleWriteData(input),
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
        ...scheduleWriteData(input),
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
          ...scheduleWriteData(input),
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
        ...scheduleWriteData(input),
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
