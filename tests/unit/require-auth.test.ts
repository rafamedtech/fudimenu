import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getPrisma: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: mocks.cookies,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: mocks.getPrisma,
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
    },
  })),
}));

const originalUseMocks = process.env.USE_MOCKS;
const originalE2eTestAuth = process.env.E2E_TEST_AUTH;

function mockCookieStore(values: Record<string, string | undefined>) {
  return {
    get: vi.fn((name: string) => {
      const value = values[name];
      return value ? { name, value } : undefined;
    }),
    delete: vi.fn(),
  };
}

async function loadRequireAuth() {
  const mod = await import('../../src/server/guards/require-auth');
  return mod.requireAuth;
}

describe('requireAuth', () => {
  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    process.env.E2E_TEST_AUTH = originalE2eTestAuth;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('uses the active tenant cookie when the user has that membership', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    const findMany = vi.fn(async () => [
      {
        tenantId: 'tenant-a',
        role: 'staff',
        tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'free' },
      },
      {
        tenantId: 'tenant-b',
        role: 'admin',
        tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'pro' },
      },
    ]);

    mocks.cookies.mockResolvedValue(mockCookieStore({ activetenantId: 'tenant-b' }));
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.getPrisma.mockReturnValue({ membership: { findMany } });

    const requireAuth = await loadRequireAuth();
    const ctx = await requireAuth();

    expect(ctx).toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      tenantId: 'tenant-b',
      plan: 'pro',
      role: 'admin',
      memberships: [
        {
          tenantId: 'tenant-a',
          role: 'staff',
          tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'free' },
        },
        {
          tenantId: 'tenant-b',
          role: 'admin',
          tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'pro' },
        },
      ],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', deletedAt: null },
      select: {
        tenantId: true,
        role: true,
        tenant: {
          select: { name: true, slug: true, plan: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('falls back to the first available membership when the cookie is absent', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    const findMany = vi.fn(async () => [
      {
        tenantId: 'tenant-a',
        role: 'owner',
        tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'free' },
      },
      {
        tenantId: 'tenant-b',
        role: 'admin',
        tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'pro' },
      },
    ]);

    mocks.cookies.mockResolvedValue(mockCookieStore({}));
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.getPrisma.mockReturnValue({ membership: { findMany } });

    const requireAuth = await loadRequireAuth();
    const ctx = await requireAuth();

    expect(ctx.tenantId).toBe('tenant-a');
    expect(ctx.plan).toBe('free');
    expect(ctx.role).toBe('owner');
  });

  it('creates auth.invalid_tenant_cookie audit when activeTenantId does not match memberships', async () => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
    const findMany = vi.fn(async () => [
      {
        tenantId: 'tenant-a',
        role: 'owner',
        tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'free' },
      },
      {
        tenantId: 'tenant-b',
        role: 'admin',
        tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'pro' },
      },
    ]);
    const auditCreate = vi.fn(async () => ({ id: 'audit-1' }));
    const cookieStore = mockCookieStore({ activetenantId: 'tenant-x' });

    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.getPrisma.mockReturnValue({
      membership: { findMany },
      auditLog: { create: auditCreate },
    });

    const requireAuth = await loadRequireAuth();
    const ctx = await requireAuth();

    expect(ctx.tenantId).toBe('tenant-a');
    expect(ctx.role).toBe('owner');
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-a',
        actorUserId: 'user-1',
        action: 'auth.invalid_tenant_cookie',
        entityType: 'membership',
        entityId: 'tenant-x',
        metadata: {
          attemptedTenantId: 'tenant-x',
          availableTenantIds: ['tenant-a', 'tenant-b'],
        },
      },
    });
    expect(cookieStore.delete).toHaveBeenCalledWith('activetenantId');
  });
});
