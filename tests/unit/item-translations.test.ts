import { describe, expect, it } from 'vitest';
import { MockMenuRepository } from '@/server/repositories/mock-menu.repository';
import { mockTenant } from '@/lib/mock/data';

const TENANT_ID = mockTenant.id;

async function createItem(repo: MockMenuRepository, translations?: Parameters<MockMenuRepository['upsertItem']>[1]['translations']) {
  return repo.upsertItem(TENANT_ID, {
    categoryId: null,
    name: 'Agua de jamaica',
    description: 'Natural',
    priceCents: 3000,
    currency: 'MXN',
    translations,
  });
}

describe('item translation persistence (mock repository)', () => {
  it('stores a translation and exposes it on the menu read', async () => {
    const repo = new MockMenuRepository();
    const created = await createItem(repo, [
      { locale: 'en', name: 'Hibiscus water', description: 'Fresh' },
    ]);

    const { items } = await repo.getMenuByTenantId(TENANT_ID);
    const stored = items.find((item) => item.id === created.id);

    expect(stored?.translations).toEqual([
      { itemId: created.id, locale: 'en', name: 'Hibiscus water', description: 'Fresh' },
    ]);
  });

  // Clearing both fields must remove the override so the public read falls back
  // to the base locale rather than rendering a blank translated item.
  it('drops the translation when the edit clears both name and description', async () => {
    const repo = new MockMenuRepository();
    const created = await createItem(repo, [
      { locale: 'en', name: 'Hibiscus water', description: 'Fresh' },
    ]);

    await repo.upsertItem(TENANT_ID, {
      id: created.id,
      categoryId: null,
      name: 'Agua de jamaica',
      description: 'Natural',
      priceCents: 3000,
      currency: 'MXN',
      translations: [{ locale: 'en', name: '', description: '' }],
    });

    const { items } = await repo.getMenuByTenantId(TENANT_ID);
    const stored = items.find((item) => item.id === created.id);

    expect(stored?.translations).toEqual([]);
  });

  it('leaves existing translations untouched when no translations are provided', async () => {
    const repo = new MockMenuRepository();
    const created = await createItem(repo, [
      { locale: 'en', name: 'Hibiscus water', description: 'Fresh' },
    ]);

    await repo.upsertItem(TENANT_ID, {
      id: created.id,
      categoryId: null,
      name: 'Agua de jamaica fría',
      description: 'Natural',
      priceCents: 3500,
      currency: 'MXN',
    });

    const { items } = await repo.getMenuByTenantId(TENANT_ID);
    const stored = items.find((item) => item.id === created.id);

    expect(stored?.name).toBe('Agua de jamaica fría');
    expect(stored?.translations).toEqual([
      { itemId: created.id, locale: 'en', name: 'Hibiscus water', description: 'Fresh' },
    ]);
  });
});
