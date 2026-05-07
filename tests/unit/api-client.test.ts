import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/lib/api/errors';
import { apiFetch, computeBackoff } from '../../src/lib/api/client';

function jsonResponse(status: number, body: unknown, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 500 ? 'Server Error' : 'Bad Request',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

describe('apiFetch', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('retries 5xx responses up to retries', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(500, { message: 'boom' }))
      .mockResolvedValueOnce(jsonResponse(500, { message: 'boom' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = apiFetch<{ ok: boolean }>('/api/test', { retries: 2, retryDelayMs: 100 });
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry 4xx responses', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(404, { code: 'not_found', message: 'missing' }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/api/missing')).rejects.toMatchObject({
      status: 404,
      code: 'not_found',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries 429 using Retry-After header', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(429, { code: 'rate_limited', message: 'slow down' }, { 'Retry-After': '2' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = apiFetch<{ ok: boolean }>('/api/rate-limited', {
      retries: 1,
      retryDelayMs: 100,
    });

    await vi.advanceTimersByTimeAsync(1999);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws ApiError after exhausting 5xx retries', async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse(503, { code: 'server_error', message: 'unavailable' }));
    vi.stubGlobal('fetch', fetchMock);

    const promise = apiFetch('/api/down', { retries: 2, retryDelayMs: 100 });
    const assertion = expect(promise).rejects.toBeInstanceOf(ApiError);
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('increases backoff exponentially between attempts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(computeBackoff(0, 100)).toBe(100);
    expect(computeBackoff(1, 100)).toBe(200);
    expect(computeBackoff(2, 100)).toBe(400);
  });
});
