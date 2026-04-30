import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUID: vi.fn(() => '11111111-2222-4333-8444-555555555555'),
  transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback(mocks.tx)),
  tx: {
    tenant: { create: vi.fn() },
    membership: { create: vi.fn() },
    category: {
      create: vi.fn(async ({ data }: { data: { name: string } }) => ({
        id: `cat-${data.name}`,
      })),
    },
    menuItem: { create: vi.fn() },
  },
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    $transaction: mocks.transaction,
  })),
}));

describe('tenantService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('seeds four editable categories for the selected cuisine when onboarding creates a tenant', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    const result = await tenantService.createFromOnboarding({
      userId: 'user-1',
      name: 'Taquería Norte',
      cuisine: 'mexicana',
      itemName: 'Taco de asada',
      priceCents: 2500,
    });

    expect(result).toEqual({
      tenantId: '11111111-2222-4333-8444-555555555555',
      slug: 'taqueria-norte-11111111',
    });
    expect(mocks.tx.category.create).toHaveBeenCalledTimes(4);
    expect(mocks.tx.category.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Tacos', sortOrder: 0 }),
      }),
    );
    expect(mocks.tx.category.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Bebidas', sortOrder: 1 }),
      }),
    );
    expect(mocks.tx.category.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Postres', sortOrder: 2 }),
      }),
    );
    expect(mocks.tx.category.create).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Otros', sortOrder: 3 }),
      }),
    );
    expect(mocks.tx.menuItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: 'cat-Tacos',
        }),
      }),
    );
  });

  it('uses cuisine-specific category presets', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    await tenantService.createFromOnboarding({
      userId: 'user-1',
      name: 'Pizza Centro',
      cuisine: 'pizza',
      itemName: 'Pizza margarita',
      priceCents: 12000,
    });

    expect(mocks.tx.category.create).toHaveBeenCalledTimes(4);
    expect(mocks.tx.category.create.mock.calls.map(([call]) => call.data.name)).toEqual([
      'Pizzas',
      'Pastas',
      'Bebidas',
      'Otros',
    ]);
  });
});
