import { afterEach, describe, expect, it, vi } from 'vitest';

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

const VALID_CSV = 'nombre,precio,categoria,seccion\nTacos,120,Antojitos,Comida';

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
    const result = await importMenuAction({ csv: VALID_CSV });

    expect(result).toEqual({ ok: false, code: 'unauthorized' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns rate_limited when the limit is exceeded', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ csv: VALID_CSV });

    expect(result).toEqual({ ok: false, code: 'rate_limited' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns too_large when row count exceeds the cap', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const rows = Array.from({ length: 501 }, (_, i) => `Item ${i},100`).join('\n');
    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ csv: `nombre,precio\n${rows}` });

    expect(result).toEqual({ ok: false, code: 'too_large' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns validation with missing headers', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ csv: 'descripcion,categoria\nfoo,bar' });

    expect(result).toEqual({ ok: false, code: 'validation', missingHeaders: ['name', 'price'] });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('returns validation with row errors and never commits a partial import', async () => {
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ csv: 'nombre,precio\nBueno,100\nMalo,gratis' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('validation');
    expect((result as { errors: unknown[] }).errors).toHaveLength(1);
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
    const result = await importMenuAction({ csv: VALID_CSV });

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
    // VALID_CSV adds a brand-new section "Comida" → 5 existing + 1 new = 6 > 5.
    const result = await importMenuAction({ csv: VALID_CSV });

    expect(result).toEqual({ ok: false, code: 'plan_limit_reached' });
    expect(mocks.importMenu).not.toHaveBeenCalled();
  });

  it('imports under the active tenant and returns the result', async () => {
    // Why: the action must always scope the write to ctx.tenantId — tenant isolation.
    mocks.requireAuth.mockResolvedValue(makeCtx('business'));
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9, resetSec: 60 });
    mocks.importMenu.mockResolvedValue({ itemsCreated: 1, categoriesCreated: 1, sectionsCreated: 1 });

    const { importMenuAction } = await loadImportActions();
    const result = await importMenuAction({ csv: VALID_CSV });

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
