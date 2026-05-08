import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tenantFindUnique: vi.fn(),
  slugHistoryFindUnique: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    tenant: {
      findUnique: mocks.tenantFindUnique,
    },
    slugHistory: {
      findUnique: mocks.slugHistoryFindUnique,
    },
  })),
}));

describe('slug service', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('normalizes and reports an unused slug as available', async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);
    mocks.slugHistoryFindUnique.mockResolvedValue(null);

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    await expect(checkTenantSlugAvailability('Taquería Pepe')).resolves.toEqual({
      available: true,
      suggestion: 'taqueria-pepe',
    });
  });

  it('suggests the tj variant when the requested slug is taken', async () => {
    mocks.tenantFindUnique.mockImplementation(({ where }: { where: { slug: string } }) =>
      where.slug === 'taqueria-pepe' ? { id: 'tenant-other' } : null,
    );
    mocks.slugHistoryFindUnique.mockResolvedValue(null);

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    await expect(checkTenantSlugAvailability('taqueria-pepe')).resolves.toEqual({
      available: false,
      suggestion: 'taqueria-pepe-tj',
    });
  });

  it('falls through to numeric and random variants in order', async () => {
    const reserved = new Set(['taqueria-pepe', 'taqueria-pepe-tj', 'taqueria-pepe-2']);
    mocks.tenantFindUnique.mockImplementation(({ where }: { where: { slug: string } }) =>
      reserved.has(where.slug) ? { id: 'tenant-other' } : null,
    );
    mocks.slugHistoryFindUnique.mockResolvedValue(null);

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    await expect(
      checkTenantSlugAvailability('taqueria-pepe', {
        createRandomSuffix: () => 'a1b2',
      }),
    ).resolves.toEqual({
      available: false,
      suggestion: 'taqueria-pepe-a1b2',
    });
  });

  it('treats the current tenant slug as available', async () => {
    mocks.tenantFindUnique.mockResolvedValue({ id: 'tenant-current' });
    mocks.slugHistoryFindUnique.mockResolvedValue(null);

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    await expect(
      checkTenantSlugAvailability('taqueria-pepe', {
        currentTenantId: 'tenant-current',
      }),
    ).resolves.toEqual({
      available: true,
      suggestion: 'taqueria-pepe',
    });
  });

  it('reports reserved blocklist slug as unavailable and suggests variant', async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);
    mocks.slugHistoryFindUnique.mockResolvedValue(null);

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    // 'admin' is in RESERVED_SLUGS — all variants must avoid it
    const result = await checkTenantSlugAvailability('admin', {
      createRandomSuffix: () => 'a1b2',
    });
    expect(result.available).toBe(false);
    expect(result.suggestion).not.toBe('admin');
  });

  it('treats an active slug_history entry as unavailable', async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);
    // active history: no deletedAt, different tenant
    mocks.slugHistoryFindUnique.mockImplementation(({ where }: { where: { slug: string } }) =>
      where.slug === 'old-slug' ? { tenantId: 'tenant-other', deletedAt: null } : null,
    );

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    const result = await checkTenantSlugAvailability('old-slug', {
      createRandomSuffix: () => 'z9y8',
    });
    expect(result.available).toBe(false);
    expect(result.suggestion).not.toBe('old-slug');
  });

  it('treats a soft-deleted slug_history entry as available', async () => {
    mocks.tenantFindUnique.mockResolvedValue(null);
    mocks.slugHistoryFindUnique.mockImplementation(({ where }: { where: { slug: string } }) =>
      where.slug === 'old-slug'
        ? { tenantId: 'tenant-other', deletedAt: new Date() }
        : null,
    );

    const { checkTenantSlugAvailability } = await import('../../src/server/services/slug.service');

    await expect(checkTenantSlugAvailability('old-slug')).resolves.toEqual({
      available: true,
      suggestion: 'old-slug',
    });
  });
});
