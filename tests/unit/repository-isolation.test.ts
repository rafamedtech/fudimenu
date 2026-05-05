import { afterEach, describe, expect, it, vi } from 'vitest';

const originalUseMocks = process.env.USE_MOCKS;

describe('repository isolation', () => {
  afterEach(async () => {
    const repositoryModule = await import('../../src/server/repositories/get-repository');
    repositoryModule.__resetMockRepository();
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

  it('reuses the mock repository instance while USE_MOCKS=true', async () => {
    process.env.USE_MOCKS = 'true';
    vi.resetModules();

    const { getMenuRepository } = await import('../../src/server/repositories/get-repository');

    const firstRepository = await getMenuRepository();
    const items = await firstRepository.getItemsByTenantId('tnt_demo');
    const item = items[0];
    await firstRepository.toggleItemAvailability('tnt_demo', item.id, !item.isAvailable);

    const secondRepository = await getMenuRepository();
    const updatedItems = await secondRepository.getItemsByTenantId('tnt_demo');
    const updatedItem = updatedItems.find((candidate) => candidate.id === item.id);

    expect(secondRepository).toBe(firstRepository);
    expect(updatedItem?.isAvailable).toBe(!item.isAvailable);
  });
});
