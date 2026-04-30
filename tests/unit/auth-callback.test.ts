import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      getUser: mocks.getUser,
    },
  })),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    membership: {
      findFirst: mocks.findFirst,
    },
  })),
}));

async function loadCallback() {
  const mod = await import('../../src/app/auth/callback/route');
  return mod.GET;
}

describe('auth callback', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('sets an httpOnly active tenant cookie after a successful login', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    mocks.findFirst.mockResolvedValue({ tenantId: 'tenant-a' });

    const GET = await loadCallback();
    const response = await GET(
      new NextRequest('http://localhost/auth/callback?code=ok&next=/dashboard'),
    );

    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
    expect(response.headers.get('set-cookie')).toContain('activetenantId=tenant-a');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=lax');
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', deletedAt: null },
      select: { tenantId: true },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('does not set an active tenant cookie when auth exchange fails', async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: new Error('bad code') });

    const GET = await loadCallback();
    const response = await GET(new NextRequest('http://localhost/auth/callback?code=bad'));

    expect(response.headers.get('location')).toBe('http://localhost/login?error=auth');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
