import { afterEach, describe, expect, it, vi } from 'vitest';
import { itemSchema } from '../../src/lib/validators/item.schema';

describe('itemSchema editorial image metadata', () => {
  const base = { categoryId: null, name: 'Tacos', priceCents: 100 };

  it('accepts alt text and a valid crop preset', () => {
    const parsed = itemSchema.parse({
      ...base,
      imageUrl: 'https://res.cloudinary.com/x/image/upload/v1/a.jpg',
      imageAltText: 'Tacos al pastor',
      imageCrop: 'top',
    });
    expect(parsed.imageAltText).toBe('Tacos al pastor');
    expect(parsed.imageCrop).toBe('top');
  });

  it('rejects an unknown crop preset', () => {
    expect(() => itemSchema.parse({ ...base, imageCrop: 'diagonal' })).toThrow();
  });

  it('rejects alt text longer than 125 chars', () => {
    expect(() => itemSchema.parse({ ...base, imageAltText: 'x'.repeat(126) })).toThrow();
  });
});

describe('MockMenuRepository editorial metadata persistence', () => {
  const originalUseMocks = process.env.USE_MOCKS;

  afterEach(async () => {
    const mod = await import('../../src/server/repositories/get-repository');
    mod.__resetMockRepository();
    process.env.USE_MOCKS = originalUseMocks;
    vi.resetModules();
  });

  async function repo() {
    process.env.USE_MOCKS = 'true';
    vi.resetModules();
    const { getMenuRepository } = await import('../../src/server/repositories/get-repository');
    return getMenuRepository();
  }

  it('persists alt text and crop alongside the image', async () => {
    const r = await repo();
    const item = await r.upsertItem('tnt_demo', {
      name: 'Tacos',
      priceCents: 100,
      imageUrl: 'https://x/a.jpg',
      imageAltText: 'Tacos al pastor',
      imageCrop: 'center',
    });
    expect(item.imageAltText).toBe('Tacos al pastor');
    expect(item.imageCrop).toBe('center');
  });

  it('clears editorial metadata when the image is removed', async () => {
    const r = await repo();
    const created = await r.upsertItem('tnt_demo', {
      name: 'Tacos',
      priceCents: 100,
      imageUrl: 'https://x/a.jpg',
      imageAltText: 'Tacos',
      imageCrop: 'top',
    });

    const cleared = await r.upsertItem('tnt_demo', {
      id: created.id,
      name: 'Tacos',
      priceCents: 100,
      imageUrl: null,
      imageAltText: 'Tacos',
      imageCrop: 'top',
    });
    expect(cleared.imageUrl).toBeNull();
    expect(cleared.imageAltText).toBeNull();
    expect(cleared.imageCrop).toBeNull();
  });

  it('ignores an invalid crop value at the persistence boundary', async () => {
    const r = await repo();
    const item = await r.upsertItem('tnt_demo', {
      name: 'Tacos',
      priceCents: 100,
      imageUrl: 'https://x/a.jpg',
      imageCrop: 'bogus' as never,
    });
    expect(item.imageCrop).toBeNull();
  });
});
