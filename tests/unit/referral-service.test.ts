import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getPrisma: vi.fn(),
  tenantFindFirst: vi.fn(),
  referralFindUnique: vi.fn(),
  referralCreate: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: mocks.getPrisma,
}));

describe('referralService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('builds the public referral code from the tenant slug and a 4-char suffix', async () => {
    const { buildReferralCode, getReferralUrl } = await import('../../src/server/services/referral.service');

    const code = buildReferralCode('tacos-pepe', 'x9k2');

    expect(code).toBe('tacos-pepe-x9k2');
    expect(getReferralUrl(code)).toBe('https://fudimenu.app/r/tacos-pepe-x9k2');
  });

  it('creates one unique referral link for a tenant', async () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.set([23, 35, 10, 28]);
        return bytes;
      },
    });
    mocks.getPrisma.mockReturnValue({
      tenant: { findFirst: mocks.tenantFindFirst },
      referral: {
        findUnique: mocks.referralFindUnique,
        create: mocks.referralCreate,
      },
    });
    mocks.tenantFindFirst.mockResolvedValue({ id: 'tenant-1', slug: 'tacos-pepe' });
    mocks.referralFindUnique.mockResolvedValue(null);
    mocks.referralCreate.mockResolvedValue({
      id: 'referral-1',
      code: 'tacos-pepe-x9k2',
      status: 'pending',
      creditedAt: null,
    });

    const { referralService } = await import('../../src/server/services/referral.service');

    const referral = await referralService.getOrCreateForTenant({
      tenantId: 'tenant-1',
      referrerId: 'user-1',
    });

    expect(mocks.referralCreate).toHaveBeenCalledWith({
      data: {
        referredTenantId: 'tenant-1',
        referrerId: 'user-1',
        code: 'tacos-pepe-x9k2',
      },
      select: {
        id: true,
        code: true,
        status: true,
        creditedAt: true,
      },
    });
    expect(referral).toEqual({
      id: 'referral-1',
      code: 'tacos-pepe-x9k2',
      status: 'pending',
      creditedAt: null,
      url: 'https://fudimenu.app/r/tacos-pepe-x9k2',
    });
  });

  it('returns the existing referral link when the tenant already has one', async () => {
    mocks.getPrisma.mockReturnValue({
      tenant: { findFirst: mocks.tenantFindFirst },
      referral: {
        findUnique: mocks.referralFindUnique,
        create: mocks.referralCreate,
      },
    });
    mocks.tenantFindFirst.mockResolvedValue({ id: 'tenant-1', slug: 'tacos-pepe' });
    mocks.referralFindUnique.mockResolvedValue({
      id: 'referral-1',
      code: 'tacos-pepe-x9k2',
      status: 'pending',
      creditedAt: null,
    });

    const { referralService } = await import('../../src/server/services/referral.service');

    const referral = await referralService.getOrCreateForTenant({
      tenantId: 'tenant-1',
      referrerId: 'user-1',
    });

    expect(mocks.referralCreate).not.toHaveBeenCalled();
    expect(referral.url).toBe('https://fudimenu.app/r/tacos-pepe-x9k2');
  });
});
