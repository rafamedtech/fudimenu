import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Verifies that PrismaMenuRepository enforces tenantId and deletedAt on all
 * mutations. Prisma uses service_role (bypasses RLS), so application-layer
 * filtering is the primary isolation boundary.
 *
 * Pattern: mock updateMany to return { count: 0 } (zero rows matched) when
 * the caller supplies the wrong tenantId — the repo must throw 'not_found'.
 */

const mocks = vi.hoisted(() => ({
  menuItemUpdateMany: vi.fn(),
  menuItemFindFirst: vi.fn(),
  menuItemFindMany: vi.fn(),
  menuItemCreate: vi.fn(),
  menuSectionUpdateMany: vi.fn(),
  menuSectionFindFirst: vi.fn(),
  menuSectionCreate: vi.fn(),
  categoryUpdateMany: vi.fn(),
  categoryFindFirst: vi.fn(),
  categoryCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    menuItem: {
      updateMany: mocks.menuItemUpdateMany,
      findFirst: mocks.menuItemFindFirst,
      findMany: mocks.menuItemFindMany,
      create: mocks.menuItemCreate,
    },
    menuSection: {
      updateMany: mocks.menuSectionUpdateMany,
      findFirst: mocks.menuSectionFindFirst,
      create: mocks.menuSectionCreate,
    },
    category: {
      updateMany: mocks.categoryUpdateMany,
      findFirst: mocks.categoryFindFirst,
      create: mocks.categoryCreate,
    },
    $transaction: mocks.transaction,
  })),
}));

async function loadRepo() {
  const { PrismaMenuRepository } = await import('../../src/server/repositories/prisma-menu.repository');
  return new PrismaMenuRepository();
}

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const ITEM_ID = 'item-b-uuid';

describe('PrismaMenuRepository — cross-tenant isolation', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('toggleItemAvailability: rejects when tenantId does not own item', async () => {
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(repo.toggleItemAvailability(TENANT_A, ITEM_ID, false)).rejects.toThrow('not_found');

    expect(mocks.menuItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ITEM_ID, tenantId: TENANT_A }),
      }),
    );
  });

  it('setItemSpecialToday: rejects when tenantId does not own item', async () => {
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(repo.setItemSpecialToday(TENANT_A, ITEM_ID, true)).rejects.toThrow('not_found');

    expect(mocks.menuItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ITEM_ID, tenantId: TENANT_A, deletedAt: null }),
      }),
    );
  });

  it('softDeleteItem: rejects when tenantId does not own item', async () => {
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(repo.softDeleteItem(TENANT_A, ITEM_ID)).rejects.toThrow('not_found');

    expect(mocks.menuItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ITEM_ID, tenantId: TENANT_A, deletedAt: null }),
      }),
    );
  });

  it('restoreItem: rejects when tenantId does not own item', async () => {
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(repo.restoreItem(TENANT_A, ITEM_ID)).rejects.toThrow('not_found');

    expect(mocks.menuItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ITEM_ID, tenantId: TENANT_A }),
      }),
    );
  });

  it('upsertItem update: rejects when tenantId does not own item', async () => {
    mocks.menuItemUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(
      repo.upsertItem(TENANT_A, {
        id: ITEM_ID,
        name: 'Cross-tenant overwrite attempt',
        priceCents: 100,
        currency: 'MXN',
      }),
    ).rejects.toThrow('not_found');

    expect(mocks.menuItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: ITEM_ID, tenantId: TENANT_A, deletedAt: null }),
      }),
    );
  });

  it('upsertSection update: rejects when tenantId does not own section', async () => {
    mocks.menuSectionUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(
      repo.upsertSection(TENANT_A, {
        id: 'section-b-uuid',
        name: 'Hacked section',
        accentColor: '#fff',
        sortOrder: 0,
        isVisible: true,
      }),
    ).rejects.toThrow('not_found');

    expect(mocks.menuSectionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'section-b-uuid', tenantId: TENANT_A, deletedAt: null }),
      }),
    );
  });

  it('deleteSection: rejects when tenantId does not own section', async () => {
    mocks.menuSectionUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(repo.deleteSection(TENANT_A, 'section-b-uuid')).rejects.toThrow('not_found');
  });

  it('upsertCategory update: rejects when tenantId does not own category', async () => {
    mocks.categoryUpdateMany.mockResolvedValue({ count: 0 });

    const repo = await loadRepo();
    await expect(
      repo.upsertCategory(TENANT_A, { id: 'cat-b-uuid', name: 'Stolen category', sortOrder: 0, isVisible: true }),
    ).rejects.toThrow('not_found');

    expect(mocks.categoryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'cat-b-uuid', tenantId: TENANT_A, deletedAt: null }),
      }),
    );
  });

  it('getItemsByTenantId: always filters by tenantId and deletedAt: null', async () => {
    mocks.menuItemFindMany.mockResolvedValue([]);

    const repo = await loadRepo();
    await repo.getItemsByTenantId(TENANT_B);

    expect(mocks.menuItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_B, deletedAt: null },
      }),
    );
  });

  it('reorderSections: applies tenantId filter to every item in transaction', async () => {
    const sectionIds = ['s1', 's2', 's3'];
    mocks.transaction.mockImplementation(async (calls: unknown[]) => Promise.all(calls));
    mocks.menuSectionUpdateMany.mockResolvedValue({ count: 1 });

    const repo = await loadRepo();
    await repo.reorderSections(TENANT_A, sectionIds);

    for (const id of sectionIds) {
      expect(mocks.menuSectionUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id, tenantId: TENANT_A }),
        }),
      );
    }
  });

  it('reorderCategories: applies tenantId filter to every item in transaction', async () => {
    const categoryIds = ['c1', 'c2'];
    mocks.transaction.mockImplementation(async (calls: unknown[]) => Promise.all(calls));
    mocks.categoryUpdateMany.mockResolvedValue({ count: 1 });

    const repo = await loadRepo();
    await repo.reorderCategories(TENANT_A, null, categoryIds);

    for (const id of categoryIds) {
      expect(mocks.categoryUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id, tenantId: TENANT_A }),
        }),
      );
    }
  });
});
