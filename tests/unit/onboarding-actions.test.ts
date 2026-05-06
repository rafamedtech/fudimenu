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
});
