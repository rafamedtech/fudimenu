import { afterEach, describe, expect, it, vi } from 'vitest';

const originalUseMocks = process.env.USE_MOCKS;

describe('repository isolation', () => {
  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    vi.doUnmock('@/server/repositories/prisma-menu.repository');
    vi.resetModules();
  });

  it('does not import PrismaMenuRepository when USE_MOCKS=true', async () => {
    process.env.USE_MOCKS = 'true';
    vi.resetModules();
    vi.doMock('@/server/repositories/prisma-menu.repository', () => {
      throw new Error('PrismaMenuRepository must not be imported in mock mode');
    });

    const { getMenuRepository } = await import('../../src/server/repositories/get-repository');

    const repository = await getMenuRepository();
    const tenant = await repository.getTenantBySlug('taqueria-don-pepe');

    expect(tenant?.id).toBe('tnt_demo');
  });
});
