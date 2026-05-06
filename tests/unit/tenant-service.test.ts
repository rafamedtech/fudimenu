import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  randomUUID: vi.fn(() => '11111111-2222-4333-8444-555555555555'),
  transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) => callback(mocks.tx)),
  startProTrialForTenant: vi.fn(async () => ({ ok: true, stripeEnabled: false })),
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

vi.mock('@/server/services/billing.service', () => ({
  billingService: {
    startProTrialForTenant: mocks.startProTrialForTenant,
  },
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
      email: 'owner@example.com',
      name: 'Taquería Norte',
      cuisine: 'mexicana',
      itemName: 'Taco de asada',
      priceCents: 2500,
    });

    expect(result).toEqual({
      tenantId: '11111111-2222-4333-8444-555555555555',
      slug: 'taqueria-norte-11111111',
    });
    expect(mocks.tx.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: 'pro',
        }),
      }),
    );
    expect(mocks.startProTrialForTenant).toHaveBeenCalledWith({
      tenantId: '11111111-2222-4333-8444-555555555555',
      tenantName: 'Taquería Norte',
      tenantSlug: 'taqueria-norte-11111111',
      userId: 'user-1',
      email: 'owner@example.com',
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
          name: 'Taco de asada',
          sortOrder: 0,
        }),
      }),
    );
    expect(mocks.tx.menuItem.create).toHaveBeenCalledTimes(6);
  });

  it('uses cuisine-specific category presets', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    await tenantService.createFromOnboarding({
      userId: 'user-1',
      email: 'owner@example.com',
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

  it('createFromOnboarding sin itemName crea 6 placeholders', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    await tenantService.createFromOnboarding({
      userId: 'user-1',
      email: 'owner@example.com',
      name: 'Taquería Norte',
      cuisine: 'mexicana',
    });

    expect(mocks.tx.menuItem.create).toHaveBeenCalledTimes(6);
    expect(mocks.tx.menuItem.create.mock.calls.map(([call]) => call.data.name)).toEqual([
      'Tacos al pastor',
      'Quesadillas',
      'Tortas',
      'Aguas frescas',
      'Flan de la casa',
      'Arroz con leche',
    ]);
    expect(mocks.tx.menuItem.create.mock.calls.map(([call]) => call.data.categoryId)).toEqual([
      'cat-Tacos',
      'cat-Bebidas',
      'cat-Postres',
      'cat-Otros',
      'cat-Tacos',
      'cat-Bebidas',
    ]);
  });

  it('createFromOnboarding con itemName crea 1 user item + 5 placeholders', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    await tenantService.createFromOnboarding({
      userId: 'user-1',
      email: 'owner@example.com',
      name: 'Sushi Norte',
      cuisine: 'sushi',
      itemName: 'Rollo especial',
      priceCents: 18000,
    });

    expect(mocks.tx.menuItem.create).toHaveBeenCalledTimes(6);
    expect(mocks.tx.menuItem.create.mock.calls.map(([call]) => ({
      name: call.data.name,
      priceCents: call.data.priceCents,
    }))).toEqual([
      { name: 'Rollo especial', priceCents: 18000 },
      { name: 'California roll', priceCents: 14000 },
      { name: 'Spicy tuna roll', priceCents: 16000 },
      { name: 'Nigiri de salmon', priceCents: 12000 },
      { name: 'Edamames', priceCents: 7000 },
      { name: 'Te helado', priceCents: 5000 },
    ]);
  });

  it('cuisine desconocido usa fallback genérico', async () => {
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID });

    const { tenantService } = await import('../../src/server/services/tenant.service');

    await tenantService.createFromOnboarding({
      userId: 'user-1',
      email: 'owner@example.com',
      name: 'Cocina Libre',
      cuisine: 'mariscos',
    });

    expect(mocks.tx.category.create.mock.calls.map(([call]) => call.data.name)).toEqual([
      'Menú',
      'Bebidas',
      'Especiales',
      'Otros',
    ]);
    expect(mocks.tx.menuItem.create).toHaveBeenCalledTimes(6);
    expect(mocks.tx.menuItem.create.mock.calls.map(([call]) => call.data.name)).toEqual([
      'Platillo de la casa',
      'Especial del dia',
      'Entrada para compartir',
      'Bebida natural',
      'Postre de la casa',
      'Combo individual',
    ]);
  });
});
