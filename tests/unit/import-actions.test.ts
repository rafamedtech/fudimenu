import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportItem } from '@/lib/validators/import.schema';

function makeCtx(plan: 'free' | 'pro' | 'business') {
  return {
    userId: 'user-1',
    email: 'owner@example.com',
    tenantId: 'tenant-1',
    plan,
    role: 'owner',
    memberships: [
      {
        tenantId: 'tenant-1',
        role: 'owner',
        tenant: { name: 'Taqueria Norte', slug: 'taqueria-norte', plan },
      },
    ],
  };
}

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  requireAuth: vi.fn(),
  importMenu: vi.fn(),
  getMenuByTenantId: vi.fn(),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock('@/server/guards/require-auth', () => ({ requireAuth: mocks.requireAuth }));
vi.mock('@/server/services/menu.service', () => ({
  menuService: {
    importMenu: mocks.importMenu,
    getMenuByTenantId: mocks.getMenuByTenantId,
  },
}));
vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
  revalidateTag: mocks.revalidateTag,
}));

async function loadImportActions() {
  return import('../../src/server/actions/import.actions');
}

function row(overrides: Partial<ImportItem> = {}): ImportItem {
  return {
    name: 'Tacos',
    description: null,
    priceCents: 12000,
    categoryName: 'Antojitos',
    sectionName: 'Comida',
    ...overrides,
  };
}

describe('importMenuAction', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns unauthorized when requireAuth throws a redirect', async () => {
    mocks.requireAuth.mockRejectedValueOnce(
      Object.assign(new Error('redirect'), { digest: 'NEXT_REDIRECT;replace;/login;307;' }),
    );

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows: [row()] });

    expect(result).toEqual({ ok: false, code: 'unauthorized' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns rate_limited when the limit is exceeded', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows: [row()] });

    expect(result).toEqual({ ok: false, code: 'rate_limited' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns too_large when the confirmed payload exceeds the row cap', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const rows = Array.from({ length: 501 }, (_, i) => row({ name: `Item ${i}` }));
    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows });

    expect(result).toEqual({ ok: false, code: 'too_large' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('re-validates the edited payload server-side and rejects tampered rows', async () => {
    // Why: the client can send edited rows; the server is the authority and must
    // reject anything that violates importItemSchema before persisting.
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({
      rows: [row(), row({ name: '', priceCents: 0 })] as ImportItem[],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
    expect((result as { errors: { rowNumber: number }[] }).errors[0].rowNumber).toBe(2);
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('rejects an empty payload', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows: [] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('blocks free plan when items would exceed the limit', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('free'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });
    mocks.getMenuByTenantId.mockResolvedValue({
      items: Array.from({ length: 20 }, (_, i) => ({ id: `i${i}` })),
      sections: [],
    });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows: [row()] });

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('validates plan limits against the final confirmed row count', async () => {
    // Why: plan limits must reflect what the user actually confirmed after editing
    // and deleting rows — not the raw file. 19 existing + 2 confirmed = 21 > 20.
    mocks.requireAuth.mockResolvedValue(makeCtx('free'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });
    mocks.getMenuByTenantId.mockResolvedValue({
      items: Array.from({ length: 19 }, (_, i) => ({ id: `i${i}` })),
      sections: [],
    });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({
      rows: [row({ name: 'A', sectionName: null }), row({ name: 'B', sectionName: null })],
    });

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('blocks free plan when new sections would exceed the limit', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('free'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });
    mocks.getMenuByTenantId.mockResolvedValue({
      items: [],
      sections: Array.from({ length: 5 }, (_, i) => ({ name: `S${i}` })),
    });

    const { importMenuAction } = await loadImportActions();
    // Brand-new section "Comida" → 5 existing + 1 new = 6 > 5.
    const result = await importMenuAction({ rows: [row()] });

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('imports the confirmed subset under the active tenant', async () => {
    // Why: the action must always scope the write to ctx.tenantId — tenant isolation.
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });
    mocks.importMenu.mockResolvedValue({ itemsCreated: 1, categoriesCreated: 1, sectionsCreated: 1 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ rows: [row()] });

    expect(result).toEqual({
      ok: true,
      result: { itemsCreated: 1, categoriesCreated: 1, sectionsCreated: 1 },
    });
    expect(mocks.importMenu).toHaveBeenCalledWith('tenant-1', [
      {
        name: 'Tacos',
        description: null,
        priceCents: 12000,
        categoryName: 'Antojitos',
        sectionName: 'Comida',
      },
    ]);
    // Business plan is unlimited → no count lookup needed.
    expect(mocks.getMenuByTenantId).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).toHaveBeenCalledWith('menu:tenant-1');
  });
});
