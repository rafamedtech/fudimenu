import 'server-only';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis ??= Redis.fromEnv();
  return redis;
}

export type RateLimitConfig = {
  identifier: string;
  requests: number;
  windowSec: number;
};

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetSec: number }> {
  const r = getRedis();
  if (!r) return { allowed: true, remaining: -1, resetSec: 0 };

  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSec} s`),
    prefix: `fudi:${config.identifier}`,
  });
  const result = await limiter.limit(key);

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetSec: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
  };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
