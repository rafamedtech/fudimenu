import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  findFirst: vi.fn(),
  getUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  signOut: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    membership: {
      findFirst: mocks.findFirst,
    },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      signOut: mocks.signOut,
    },
  })),
}));

const originalUseMocks = process.env.USE_MOCKS;

async function loadAuthActions() {
  return import('../../src/server/actions/auth.actions');
}

describe('auth actions', () => {
  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('updates the active tenant cookie when the user has access to the tenant', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.findFirst.mockResolvedValue({ tenantId: 'tenant-b' });

    const { switchActiveTenantAction } = await loadAuthActions();
    const result = await switchActiveTenantAction('tenant-b');

    expect(result).toEqual({ ok: true, tenantId: 'tenant-b' });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', tenantId: 'tenant-b', deletedAt: null },
      select: { tenantId: true },
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      'activetenantId',
      'tenant-b',
      expect.objectContaining({ httpOnly: true, path: '/', sameSite: 'lax' }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });

  it('does not update the active tenant cookie when membership is missing', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.findFirst.mockResolvedValue(null);

    const { switchActiveTenantAction } = await loadAuthActions();
    const result = await switchActiveTenantAction('tenant-x');

    expect(result.ok).toBe(false);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('clears the active tenant cookie on sign out', async () => {
    process.env.USE_MOCKS = 'false';

    const { signOutAction } = await loadAuthActions();
    const result = await signOutAction();

    expect(result).toEqual({ ok: true });
    expect(mocks.cookieDelete).toHaveBeenCalledWith('activetenantId');
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
