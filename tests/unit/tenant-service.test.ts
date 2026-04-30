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

  it('creates the default Otros category when a tenant is created from onboarding', async () => {
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
    expect(mocks.tx.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Otros',
          sortOrder: 999,
        }),
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
});
