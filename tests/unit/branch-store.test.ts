import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let useBranchStore: typeof import('@/stores/branch.store').useBranchStore;

function stubLocalStorage() {
  const values = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    get length() {
      return values.size;
    },
  });
  vi.stubGlobal('window', { localStorage: globalThis.localStorage });
}

describe('branch store', () => {
  beforeEach(async () => {
    vi.resetModules();
    stubLocalStorage();
    ({ useBranchStore } = await import('@/stores/branch.store'));
  });

  afterEach(() => {
    useBranchStore.setState({ activeBranchId: null, activeBranchTenantId: null });
    vi.unstubAllGlobals();
  });

  it('keeps a hydrated branch that belongs to the active tenant', () => {
    useBranchStore.getState().setBranch('branch-a', 'tenant-a');

    useBranchStore.getState().validateHydratedBranch('tenant-a', [
      { id: 'branch-a', tenantId: 'tenant-a' },
    ]);

    expect(useBranchStore.getState().activeBranchId).toBe('branch-a');
    expect(useBranchStore.getState().activeBranchTenantId).toBe('tenant-a');
  });

  it('resets a hydrated branch from another tenant', () => {
    useBranchStore.getState().setBranch('branch-a', 'tenant-a');

    useBranchStore.getState().validateHydratedBranch('tenant-b');

    expect(useBranchStore.getState().activeBranchId).toBeNull();
    expect(useBranchStore.getState().activeBranchTenantId).toBeNull();
  });

  it('resets old hydrated branches without tenant metadata', () => {
    useBranchStore.setState({ activeBranchId: 'legacy-branch', activeBranchTenantId: null });

    useBranchStore.getState().validateHydratedBranch('tenant-a');

    expect(useBranchStore.getState().activeBranchId).toBeNull();
    expect(useBranchStore.getState().activeBranchTenantId).toBeNull();
  });

  it('resets when the branch is not in the active tenant branch list', () => {
    useBranchStore.getState().setBranch('branch-a', 'tenant-a');

    useBranchStore.getState().validateHydratedBranch('tenant-a', [
      { id: 'branch-b', tenantId: 'tenant-a' },
    ]);

    expect(useBranchStore.getState().activeBranchId).toBeNull();
    expect(useBranchStore.getState().activeBranchTenantId).toBeNull();
  });
});
