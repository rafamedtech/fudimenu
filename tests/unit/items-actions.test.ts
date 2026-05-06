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
});
