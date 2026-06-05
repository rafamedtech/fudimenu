import { beforeEach, describe, expect, it } from 'vitest';
import { MockMenuRepository } from '@/server/repositories/mock-menu.repository';
import type { ItemUpsertInput } from '@/types/domain';

// Persistence contract for visual variants, exercised against the mock repo
// (the Prisma repo mirrors the same logic but needs a live DB). These guard the
// acceptance behaviours: ordered create, full replace, delete via empty array,
// preservation on partial updates, and tenant scoping. Out of scope by design:
// POS modifiers, required rules, cart, ordering.

const TENANT = 'tnt_demo';
const OTHER_TENANT = 'tnt_other';

const baseItem: ItemUpsertInput = {
  categoryId: null,
  name: 'Jugo',
  description: null,
  priceCents: 8500,
  currency: 'MXN',
};

let repo: MockMenuRepository;

async function readVariants(itemId: string, tenantId = TENANT) {
  const items = await repo.getItemsByTenantId(tenantId);
  return items.find((item) => item.id === itemId)?.variants;
}

beforeEach(() => {
  repo = new MockMenuRepository();
});

describe('variant persistence', () => {
  it('creates variants and assigns sortOrder from the array order', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [
        { name: 'Chico', priceCents: 8500 },
        { name: 'Mediano', priceCents: 9000 },
        { name: 'Grande', priceCents: 9500 },
      ],
    });

    const variants = await readVariants(created.id);
    expect(variants?.map((v) => [v.name, v.priceCents, v.sortOrder])).toEqual([
      ['Chico', 8500, 0],
      ['Mediano', 9000, 1],
      ['Grande', 9500, 2],
    ]);
  });

  it('replaces the whole set on edit (old variants do not linger)', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [
        { name: 'Chico', priceCents: 8500 },
        { name: 'Grande', priceCents: 9500 },
      ],
    });

    await repo.upsertItem(TENANT, {
      id: created.id,
      ...baseItem,
      variants: [{ name: 'Único', priceCents: 10000 }],
    });

    const variants = await readVariants(created.id);
    expect(variants?.map((v) => [v.name, v.sortOrder])).toEqual([['Único', 0]]);
  });

  it('deletes all variants when an empty array is sent', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [{ name: 'Chico', priceCents: 8500 }],
    });

    await repo.upsertItem(TENANT, { id: created.id, ...baseItem, variants: [] });

    expect(await readVariants(created.id)).toEqual([]);
  });

  it('preserves variants when a partial update omits the variants field', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [
        { name: 'Chico', priceCents: 8500 },
        { name: 'Grande', priceCents: 9500 },
      ],
    });

    // Partial update — only availability — must not wipe the variant set.
    await repo.toggleItemAvailability(TENANT, created.id, false);
    expect((await readVariants(created.id))?.map((v) => v.name)).toEqual(['Chico', 'Grande']);

    // An upsert that simply does not include `variants` also preserves them.
    await repo.upsertItem(TENANT, { id: created.id, name: 'Jugo natural' });
    const after = await readVariants(created.id);
    expect(after?.map((v) => v.name)).toEqual(['Chico', 'Grande']);
  });

  it('scopes variants to the owning tenant', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [{ name: 'Chico', priceCents: 8500 }],
    });

    // The item (and its variants) belongs to TENANT only.
    expect((await readVariants(created.id, TENANT))?.length).toBe(1);
    expect(await readVariants(created.id, OTHER_TENANT)).toBeUndefined();
    expect(await repo.getItemsByTenantId(OTHER_TENANT)).toEqual([]);
  });

  it('drops a no-op partial update edge: empty array replaces, undefined preserves', async () => {
    const created = await repo.upsertItem(TENANT, {
      ...baseItem,
      variants: [{ name: 'Chico', priceCents: 8500 }],
    });

    // undefined (field present, value undefined) is still "sent" → replace to none.
    await repo.upsertItem(TENANT, { id: created.id, ...baseItem, variants: undefined });
    expect(await readVariants(created.id)).toEqual([]);
  });
});
