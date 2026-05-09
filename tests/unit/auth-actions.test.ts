import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
  findFirst: vi.fn(),
  getUser: vi.fn(),
  checkRateLimit: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  })),
  headers: vi.fn(async () => new Headers({ 'x-forwarded-for': '127.0.0.1' })),
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

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: mocks.checkRateLimit,
  getClientIp: vi.fn((headers: Headers) => headers.get('x-forwarded-for') ?? 'unknown'),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      signInWithOtp: mocks.signInWithOtp,
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

  it('returns reset minutes when magic link email rate limit is reached', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.checkRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetSec: 181,
    });

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    formData.set('email', 'owner@example.com');
    const result = await signInWithMagicLinkAction(formData);

    expect(result).toEqual({
      ok: false,
      error: 'Demasiados intentos. Espera 4 min.',
    });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith('owner@example.com', {
      identifier: 'magic-link-email',
      requests: 5,
      windowSec: 3600,
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('blocks magic links when IP rate limit is reached', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.checkRateLimit
      .mockResolvedValueOnce({ allowed: true, remaining: 4, resetSec: 0 })
      .mockResolvedValueOnce({ allowed: false, remaining: 0, resetSec: 3600 });

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    formData.set('email', 'owner@example.com');
    const result = await signInWithMagicLinkAction(formData);

    expect(result).toEqual({
      ok: false,
      error: 'Demasiados intentos desde esta red.',
    });
    expect(mocks.checkRateLimit).toHaveBeenNthCalledWith(2, '127.0.0.1', {
      identifier: 'magic-link-ip',
      requests: 20,
      windowSec: 3600,
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('updates the active tenant cookie when the user has access to the tenant', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.findFirst.mockResolvedValue({ tenantId: 'tenant-b' });

    const { switchTenantAction } = await loadAuthActions();
    const result = await switchTenantAction('tenant-b');

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

    const { switchTenantAction } = await loadAuthActions();
    const result = await switchTenantAction('tenant-x');

    expect(result.ok).toBe(false);
    expect(mocks.cookieSet).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('clears the active tenant cookie on sign out', async () => {
    process.env.USE_MOCKS = 'false';

    const { signOutAction } = await loadAuthActions();
    const result = await signOutAction();

    expect(result).toEqual({ ok: true, clearLocalStorageKeys: ['fudi:branch'] });
    expect(mocks.cookieDelete).toHaveBeenCalledWith('activetenantId');
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it('sends magic link and returns ok when Supabase succeeds', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.checkRateLimit
      .mockResolvedValueOnce({ allowed: true, remaining: 4, resetSec: 0 })
      .mockResolvedValueOnce({ allowed: true, remaining: 19, resetSec: 0 });
    mocks.signInWithOtp.mockResolvedValue({ error: null });

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    formData.set('email', 'owner@example.com');
    formData.set('next', '/dashboard');
    const result = await signInWithMagicLinkAction(formData);

    expect(result).toEqual({ ok: true, message: 'Mandamos un link a tu correo 🔮' });
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: 'owner@example.com',
      options: expect.objectContaining({ emailRedirectTo: expect.stringContaining('/auth/callback?next=') }),
    });
  });

  it('passes next param through magic link emailRedirectTo', async () => {
    process.env.USE_MOCKS = 'false';
    mocks.checkRateLimit
      .mockResolvedValueOnce({ allowed: true, remaining: 4, resetSec: 0 })
      .mockResolvedValueOnce({ allowed: true, remaining: 19, resetSec: 0 });
    mocks.signInWithOtp.mockResolvedValue({ error: null });

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    formData.set('email', 'owner@example.com');
    formData.set('next', '/menu');
    await signInWithMagicLinkAction(formData);

    const call = mocks.signInWithOtp.mock.calls[0]?.[0];
    expect(call.options.emailRedirectTo).toContain('%2Fmenu');
  });

  it('skips Supabase signOut in mock mode', async () => {
    process.env.USE_MOCKS = 'true';

    const { signOutAction } = await loadAuthActions();
    const result = await signOutAction();

    expect(result.ok).toBe(true);
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('returns Correo inválido when email is malformed', async () => {
    process.env.USE_MOCKS = 'false';

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    formData.set('email', 'not-an-email');
    const result = await signInWithMagicLinkAction(formData);

    expect(result).toEqual({ ok: false, error: 'Correo inválido' });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });

  it('returns Correo inválido when email field is empty', async () => {
    process.env.USE_MOCKS = 'false';

    const { signInWithMagicLinkAction } = await loadAuthActions();
    const formData = new FormData();
    const result = await signInWithMagicLinkAction(formData);

    expect(result).toEqual({ ok: false, error: 'Correo inválido' });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });
});
