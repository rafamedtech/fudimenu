import { afterEach, describe, expect, it, vi } from 'vitest';
import { dedupeImageUrls } from '../../src/lib/image-library';

describe('dedupeImageUrls', () => {
  it('drops nullish values and duplicates, preserving first-seen order', () => {
    expect(
      dedupeImageUrls(['a', null, 'b', undefined, 'a', 'c', 'b']),
    ).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array when nothing is usable', () => {
    expect(dedupeImageUrls([null, undefined])).toEqual([]);
  });
});

describe('MockMenuRepository.getImageLibrary', () => {
  const originalUseMocks = process.env.USE_MOCKS;

  afterEach(async () => {
    const mod = await import('../../src/server/repositories/get-repository');
    mod.__resetMockRepository();
    process.env.USE_MOCKS = originalUseMocks;
    vi.resetModules();
  });

  it('aggregates and dedupes images in use for the tenant', async () => {
    process.env.USE_MOCKS = 'true';
    vi.resetModules();
    const { getMenuRepository } = await import('../../src/server/repositories/get-repository');
    const repo = await getMenuRepository();

    // Seed two items pointing at the same URL → must appear once.
    await repo.upsertItem('tnt_demo', { name: 'A', priceCents: 100, imageUrl: 'https://x/dup.jpg' });
    await repo.upsertItem('tnt_demo', { name: 'B', priceCents: 100, imageUrl: 'https://x/dup.jpg' });

    const images = await repo.getImageLibrary('tnt_demo');
    expect(images.filter((url) => url === 'https://x/dup.jpg')).toHaveLength(1);
  });

  it('never leaks images across tenants', async () => {
    process.env.USE_MOCKS = 'true';
    vi.resetModules();
    const { getMenuRepository } = await import('../../src/server/repositories/get-repository');
    const repo = await getMenuRepository();

    expect(await repo.getImageLibrary('some-other-tenant')).toEqual([]);
  });
});

describe('listTenantImagesAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock('@/server/guards/require-auth');
    vi.doUnmock('@/server/services/menu.service');
  });

  it('returns the active tenant images', async () => {
    vi.resetModules();
    vi.doMock('@/server/guards/require-auth', () => ({
      requireAuth: vi.fn(async () => ({ tenantId: 'tnt_demo' })),
    }));
    vi.doMock('@/server/services/menu.service', () => ({
      menuService: { getImageLibrary: vi.fn(async () => ['https://x/a.jpg']) },
    }));

    const { listTenantImagesAction } = await import(
      '../../src/server/actions/image-library.actions'
    );
    const result = await listTenantImagesAction();
    expect(result).toEqual({ ok: true, images: ['https://x/a.jpg'] });
  });

  it('returns unauthorized when auth redirects', async () => {
    vi.resetModules();
    vi.doMock('@/server/guards/require-auth', () => ({
      requireAuth: vi.fn(async () => {
        throw { digest: 'NEXT_REDIRECT;replace;/login;307;' };
      }),
    }));
    vi.doMock('@/server/services/menu.service', () => ({
      menuService: { getImageLibrary: vi.fn() },
    }));

    const { listTenantImagesAction } = await import(
      '../../src/server/actions/image-library.actions'
    );
    const result = await listTenantImagesAction();
    expect(result).toEqual({ ok: false, code: 'unauthorized' });
  });
});
