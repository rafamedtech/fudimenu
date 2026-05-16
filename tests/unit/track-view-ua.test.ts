import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  tenantFindUnique: vi.fn(async () => ({ id: 'tenant-1', deletedAt: null })),
  menuViewCreate: vi.fn(async () => ({ id: 'view-1' })),
}));

vi.mock('@/lib/db/prisma', () => ({
  getPrisma: vi.fn(() => ({
    tenant: {
      findUnique: mocks.tenantFindUnique,
    },
    menuView: {
      create: mocks.menuViewCreate,
    },
  })),
}));

const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const originalUseMocks = process.env.USE_MOCKS;

function requestWithUserAgent(userAgent: string | null) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (userAgent) headers.set('user-agent', userAgent);

  return new Request('https://app.fudimenu.test/api/track/view', {
    method: 'POST',
    headers,
    body: JSON.stringify({ slug: 'taqueria-don-pepe' }),
  });
}

async function postTrackView(userAgent: string | null) {
  const { POST } = await import('../../src/app/api/track/view/route');
  await POST(requestWithUserAgent(userAgent) as NextRequest);
  return (mocks.menuViewCreate.mock.calls as Array<Array<{ data: { userAgent: string | null } }>>).at(-1)?.[0].data.userAgent;
}

describe('track view user-agent anonymization', () => {
  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
    process.env.USE_MOCKS = originalUseMocks;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('keeps only coarse browser, OS, and device type for mobile Safari', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const userAgent = await postTrackView(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    if (!userAgent) throw new Error('missing anonymized user agent');

    expect(JSON.parse(userAgent)).toEqual({
      browser: 'Safari',
      browserMajor: '17',
      os: 'iOS',
      deviceType: 'mobile',
    });
  });

  it('stores null when user-agent is missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    await postTrackView(null);

    expect(mocks.menuViewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userAgent: null,
        }),
      }),
    );
  });

  it('does not throw for invalid user-agent strings', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const userAgent = await postTrackView('not a real ua');
    if (!userAgent) throw new Error('missing anonymized user agent');

    expect(JSON.parse(userAgent)).toEqual({
      browser: null,
      browserMajor: null,
      os: null,
      deviceType: 'desktop',
    });
  });

  it('does not touch Prisma in mock mode', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.USE_MOCKS = 'true';

    const { POST } = await import('../../src/app/api/track/view/route');
    const response = await POST(requestWithUserAgent('not a real ua') as NextRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, menuViewId: null });
    expect(mocks.tenantFindUnique).not.toHaveBeenCalled();
    expect(mocks.menuViewCreate).not.toHaveBeenCalled();
  });
});
