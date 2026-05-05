import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fromEnv: vi.fn(() => ({ redis: true })),
  limit: vi.fn(),
  slidingWindow: vi.fn(() => ({ window: true })),
  ratelimitCreate: vi.fn(function RatelimitMock() {
    return { limit: mocks.limit };
  }),
}));

vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: mocks.fromEnv,
  },
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(mocks.ratelimitCreate, {
    slidingWindow: mocks.slidingWindow,
  }),
}));

const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

describe('checkRateLimit', () => {
  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('allows requests below the limit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    mocks.limit.mockResolvedValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60_000,
    });

    const { checkRateLimit } = await import('../../src/lib/ratelimit');
    const result = await checkRateLimit('client-1', {
      identifier: 'magic-link',
      requests: 5,
      windowSec: 60,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(mocks.fromEnv).toHaveBeenCalledOnce();
    expect(mocks.slidingWindow).toHaveBeenCalledWith(5, '60 s');
    expect(mocks.limit).toHaveBeenCalledWith('client-1');
  });

  it('blocks requests at the limit with reset seconds', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    mocks.limit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 5_000,
    });

    const { checkRateLimit } = await import('../../src/lib/ratelimit');
    const result = await checkRateLimit('client-1', {
      identifier: 'magic-link',
      requests: 5,
      windowSec: 60,
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetSec).toBeGreaterThan(0);
  });

  it('bypasses rate limiting when Upstash env vars are missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { checkRateLimit } = await import('../../src/lib/ratelimit');
    const result = await checkRateLimit('client-1', {
      identifier: 'magic-link',
      requests: 5,
      windowSec: 60,
    });

    expect(result).toEqual({ allowed: true, remaining: -1, resetSec: 0 });
    expect(mocks.fromEnv).not.toHaveBeenCalled();
    expect(mocks.limit).not.toHaveBeenCalled();
  });
});
