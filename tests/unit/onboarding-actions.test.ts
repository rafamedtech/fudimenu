import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  checkRateLimit: vi.fn(),
  membershipFindFirst: vi.fn(),
  getUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  revalidatePath: vi.fn(),
  createFromOnboarding: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    membership: {
      findFirst: mocks.membershipFindFirst,
    },
  })),
}));

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock('@/server/services/tenant.service', () => ({
  tenantService: {
    createFromOnboarding: mocks.createFromOnboarding,
  },
}));

vi.mock('@/server/repositories/get-repository', () => ({
  getMenuRepository: vi.fn(),
}));

const originalUseMocks = process.env.USE_MOCKS;
const originalE2eTestAuth = process.env.E2E_TEST_AUTH;

async function loadOnboardingActions() {
  return import('../../src/server/actions/onboarding.actions');
}

describe('onboarding actions', () => {
  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    process.env.E2E_TEST_AUTH = originalE2eTestAuth;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('throws rate_limited before membership lookup or tenant creation when user limit is reached', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'owner@example.com' } },
    });
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetSec: 3600,
    });

    const { completeOnboardingAction } = await loadOnboardingActions();

    await expect(
      completeOnboardingAction({
        name: 'Taqueria Norte',
        cuisine: 'mexicana',
        itemName: 'Taco de asada',
        priceCents: 2500,
      }),
    ).rejects.toThrow('rate_limited');
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('user-1', {
      identifier: 'onboarding-complete',
      requests: 5,
      windowSec: 3600,
    });
    expect(mocks.membershipFindFirst).not.toHaveBeenCalled();
    expect(mocks.createFromOnboarding).not.toHaveBeenCalled();
  });

  it('returns existing:true and sets cookie when user already has a membership', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'owner@example.com' } },
    });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetSec: 0 });
    mocks.membershipFindFirst.mockResolvedValue({
      tenantId: 'tenant-exists',
      tenant: { slug: 'taqueria-norte' },
    });

    const { completeOnboardingAction } = await loadOnboardingActions();
    const result = await completeOnboardingAction({
      name: 'Taqueria Norte',
      cuisine: 'mexicana',
    });

    expect(result).toEqual({
      ok: true,
      existing: true,
      tenantId: 'tenant-exists',
      slug: 'taqueria-norte',
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'activetenantId',
      'tenant-exists',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mocks.createFromOnboarding).not.toHaveBeenCalled();
  });

  it('creates a new tenant and sets cookie for a fresh user', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-new', email: 'new@example.com' } },
    });
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4, resetSec: 0 });
    mocks.membershipFindFirst.mockResolvedValue(null);
    mocks.createFromOnboarding.mockResolvedValue({ tenantId: 'tenant-new', slug: 'taqueria-nueva' });

    const { completeOnboardingAction } = await loadOnboardingActions();
    const result = await completeOnboardingAction({
      name: 'Taqueria Nueva',
      cuisine: 'mexicana',
    });

    expect(result).toEqual({ ok: true, existing: false, tenantId: 'tenant-new', slug: 'taqueria-nueva' });
    expect(mocks.createFromOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-new', name: 'Taqueria Nueva', cuisine: 'mexicana' }),
    );
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'activetenantId',
      'tenant-new',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('createSecondTenantAction creates a tenant even when membership exists', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'owner@example.com' } },
    });
    mocks.createFromOnboarding.mockResolvedValue({ tenantId: 'tenant-2', slug: 'taqueria-2' });

    const { createSecondTenantAction } = await loadOnboardingActions();
    const result = await createSecondTenantAction({ name: 'Taqueria 2', cuisine: 'pizza' });

    expect(result).toEqual({ ok: true, existing: false, tenantId: 'tenant-2', slug: 'taqueria-2' });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'activetenantId',
      'tenant-2',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
