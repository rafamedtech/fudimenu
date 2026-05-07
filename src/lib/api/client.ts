import { ApiError } from './errors';

type FetchOpts = RequestInit & { retries?: number; retryDelayMs?: number };
type RetryableApiError = ApiError & { retryAfterMs?: number };

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 200;
const MAX_DELAY_MS = 5000;

export function computeBackoff(attempt: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * exponential * 0.3;
  return Math.min(MAX_DELAY_MS, exponential + jitter);
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { retries = DEFAULT_RETRIES, retryDelayMs = DEFAULT_BASE_DELAY_MS, ...rest } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(path, {
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          ...rest.headers,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const error: RetryableApiError = new ApiError(
          res.status,
          body.code ?? mapStatusToCode(res.status),
          body.message ?? res.statusText,
          body.details,
        );
        if (res.status === 429) error.retryAfterMs = parseRetryAfterMs(res.headers.get('Retry-After'));
        throw error;
      }

      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 429) {
        throw err;
      }
      if (attempt === retries) throw err;
      const retryAfterMs = err instanceof ApiError ? (err as RetryableApiError).retryAfterMs : undefined;
      await new Promise((r) =>
        setTimeout(r, retryAfterMs ?? computeBackoff(attempt, retryDelayMs)),
      );
    }
  }
  throw lastErr;
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);

  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return undefined;

  return Math.max(0, dateMs - Date.now());
}

function mapStatusToCode(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  return 'server_error';
}
