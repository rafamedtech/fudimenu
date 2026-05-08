import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  requireAuth: vi.fn(async () => ({
    userId: 'user-1',
    email: 'owner@example.com',
    tenantId: 'tenant-1',
    plan: 'pro',
    role: 'owner',
    memberships: [
      {
        tenantId: 'tenant-1',
        role: 'owner',
        tenant: { name: 'Taqueria Norte', slug: 'taqueria-norte', plan: 'pro' },
      },
    ],
  })),
  getMenuByTenantId: vi.fn(),
  upsertItem: vi.fn(),
  setItemSpecialToday: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/server/guards/require-auth', () => ({
  requireAuth: mocks.requireAuth,
}));

vi.mock('@/server/services/menu.service', () => ({
  menuService: {
    getMenuByTenantId: mocks.getMenuByTenantId,
    upsertItem: mocks.upsertItem,
    setItemSpecialToday: mocks.setItemSpecialToday,
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

async function loadItemsActions() {
  return import('../../src/server/actions/items.actions');
}

describe('items actions', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns rate_limited before validating or writing an item when tenant limit is reached', async () => {
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetSec: 60,
    });

    const { upsertItemAction } = await loadItemsActions();
    const result = await upsertItemAction({ invalid: true });

    expect(result).toEqual({ ok: false, code: 'rate_limited' });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('tenant-1', {
      identifier: 'item-upsert',
      requests: 200,
      windowSec: 60,
    });
    expect(mocks.getMenuByTenantId).not.toHaveBeenCalled();
    expect(mocks.upsertItem).not.toHaveBeenCalled();
  });

  it('blocks free plan from setting isSpecialToday via upsertItemAction', async () => {
    mocks.requireAuth.mockResolvedValueOnce({
      userId: 'user-1',
      email: 'free@example.com',
      tenantId: 'tenant-1',
      plan: 'free',
      role: 'owner',
      memberships: [
        {
          tenantId: 'tenant-1',
          role: 'owner',
          tenant: { name: 'Taqueria Norte', slug: 'taqueria-norte', plan: 'free' },
        },
      ],
    });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 199, resetSec: 60 });

    const { upsertItemAction } = await loadItemsActions();
    const result = await upsertItemAction({
      name: 'Taco',
      categoryId: null,
      priceCents: 8000,
      isSpecialToday: true,
      specialPrice: 6000,
    });

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.upsertItem).not.toHaveBeenCalled();
  });

  it('allows pro plan to set isSpecialToday via upsertItemAction', async () => {
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 199, resetSec: 60 });
    mocks.getMenuByTenantId.mockResolvedValue({ tenant: { plan: 'pro' }, items: [] });
    mocks.upsertItem.mockResolvedValue({ id: 'item-1', name: 'Taco', isSpecialToday: true });

    const { upsertItemAction } = await loadItemsActions();
    const result = await upsertItemAction({
      name: 'Taco',
      categoryId: null,
      priceCents: 8000,
      isSpecialToday: true,
      specialPrice: 6000,
    });

    expect(result).toEqual({ ok: true, item: expect.objectContaining({ isSpecialToday: true }) });
    expect(mocks.upsertItem).toHaveBeenCalled();
  });

  it('blocks free plan from setItemSpecialTodayAction', async () => {
    mocks.requireAuth.mockResolvedValueOnce({
      userId: 'user-1',
      email: 'free@example.com',
      tenantId: 'tenant-1',
      plan: 'free',
      role: 'owner',
      memberships: [],
    });

    const { setItemSpecialTodayAction } = await loadItemsActions();
    const result = await setItemSpecialTodayAction('item-1', true);

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.setItemSpecialToday).not.toHaveBeenCalled();
  });

  it('allows free plan to un-set a special (isSpecialToday=false)', async () => {
    mocks.requireAuth.mockResolvedValueOnce({
      userId: 'user-1',
      email: 'free@example.com',
      tenantId: 'tenant-1',
      plan: 'free',
      role: 'owner',
      memberships: [
        {
          tenantId: 'tenant-1',
          role: 'owner',
          tenant: { name: 'Taqueria Norte', slug: 'taqueria-norte', plan: 'free' },
        },
      ],
    });
    mocks.setItemSpecialToday.mockResolvedValue({ id: 'item-1', isSpecialToday: false });

    const { setItemSpecialTodayAction } = await loadItemsActions();
    const result = await setItemSpecialTodayAction('item-1', false);

    expect(result).toEqual({ ok: true, item: expect.objectContaining({ isSpecialToday: false }) });
    expect(mocks.setItemSpecialToday).toHaveBeenCalledWith('tenant-1', 'item-1', false);
  });
});

describe('itemSchema specialPrice validation', () => {
  it('rejects specialPrice >= priceCents when isSpecialToday is true', async () => {
    const { itemSchema } = await import('../../src/lib/validators/item.schema');
    expect(() =>
      itemSchema.parse({
        name: 'Taco',
        categoryId: null,
        priceCents: 8000,
        isSpecialToday: true,
        specialPrice: 8000,
      }),
    ).toThrow();
  });

  it('rejects specialPrice > priceCents when isSpecialToday is true', async () => {
    const { itemSchema } = await import('../../src/lib/validators/item.schema');
    expect(() =>
      itemSchema.parse({
        name: 'Taco',
        categoryId: null,
        priceCents: 8000,
        isSpecialToday: true,
        specialPrice: 9000,
      }),
    ).toThrow();
  });

  it('accepts specialPrice < priceCents when isSpecialToday is true', async () => {
    const { itemSchema } = await import('../../src/lib/validators/item.schema');
    expect(() =>
      itemSchema.parse({
        name: 'Taco',
        categoryId: null,
        priceCents: 8000,
        isSpecialToday: true,
        specialPrice: 6000,
      }),
    ).not.toThrow();
  });

  it('accepts specialPrice >= priceCents when isSpecialToday is false', async () => {
    const { itemSchema } = await import('../../src/lib/validators/item.schema');
    expect(() =>
      itemSchema.parse({
        name: 'Taco',
        categoryId: null,
        priceCents: 8000,
        isSpecialToday: false,
        specialPrice: 9000,
      }),
    ).not.toThrow();
  });

  it('accepts null specialPrice when isSpecialToday is true', async () => {
    const { itemSchema } = await import('../../src/lib/validators/item.schema');
    expect(() =>
      itemSchema.parse({
        name: 'Taco',
        categoryId: null,
        priceCents: 8000,
        isSpecialToday: true,
        specialPrice: null,
      }),
    ).not.toThrow();
  });
});
