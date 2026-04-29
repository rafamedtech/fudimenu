import { ApiError } from './errors';

type FetchOpts = RequestInit & { retries?: number };

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { retries = 1, ...rest } = opts;

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
        throw new ApiError(
          res.status,
          body.code ?? mapStatusToCode(res.status),
          body.message ?? res.statusText,
          body.details,
        );
      }

      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiError && err.status < 500) throw err;
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function mapStatusToCode(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 422) return 'validation';
  if (status === 429) return 'rate_limited';
  return 'server_error';
}
