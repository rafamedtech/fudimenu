import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getPrisma: vi.fn(),
  resetPrisma: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: mocks.getPrisma,
  resetPrisma: mocks.resetPrisma,
}));

describe('getUserMemberships', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns memberships for a userId', async () => {
    mocks.findMany.mockResolvedValue([
      {
        tenantId: 'tenant-a',
        role: 'owner',
        tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'pro' },
      },
      {
        tenantId: 'tenant-b',
        role: 'staff',
        tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'free' },
      },
    ]);
    mocks.getPrisma.mockReturnValue({ membership: { findMany: mocks.findMany } });

    const { getUserMemberships } = await import(
      '../../src/server/guards/get-user-memberships'
    );

    await expect(getUserMemberships('user-1')).resolves.toEqual([
      {
        tenantId: 'tenant-a',
        role: 'owner',
        tenant: { name: 'Tenant A', slug: 'tenant-a', plan: 'pro' },
      },
      {
        tenantId: 'tenant-b',
        role: 'staff',
        tenant: { name: 'Tenant B', slug: 'tenant-b', plan: 'free' },
      },
    ]);
  });

  it('filters out soft-deleted memberships', async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.getPrisma.mockReturnValue({ membership: { findMany: mocks.findMany } });

    const { getUserMemberships } = await import(
      '../../src/server/guards/get-user-memberships'
    );

    await getUserMemberships('user-1');

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', deletedAt: null },
      }),
    );
  });

  it('orders memberships by creation date ascending', async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.getPrisma.mockReturnValue({ membership: { findMany: mocks.findMany } });

    const { getUserMemberships } = await import(
      '../../src/server/guards/get-user-memberships'
    );

    await getUserMemberships('user-1');

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      }),
    );
  });
});
