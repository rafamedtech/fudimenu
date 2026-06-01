import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateSession: vi.fn(),
}));

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: mocks.updateSession,
}));

const originalUseMocks = process.env.USE_MOCKS;
const originalE2eAuth = process.env.E2E_TEST_AUTH;

async function loadMiddleware() {
  const mod = await import('../../src/middleware');
  return mod.middleware;
}

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe('middleware', () => {
  beforeEach(() => {
    process.env.USE_MOCKS = 'false';
    process.env.E2E_TEST_AUTH = 'false';
  });

  afterEach(() => {
    process.env.USE_MOCKS = originalUseMocks;
    process.env.E2E_TEST_AUTH = originalE2eAuth;
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('redirects authenticated user without active tenant cookie to /onboarding on admin route', async () => {
    const { NextResponse } = await import('next/server');
    mocks.updateSession.mockImplementation(async (req: NextRequest) => ({
      response: NextResponse.next({ request: { headers: req.headers } }),
      user: { id: 'user-1', email: 'user@example.com' },
    }));

    const middleware = await loadMiddleware();
    const response = await middleware(makeRequest('http://localhost/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/onboarding');
  });

  it('does not redirect to /onboarding when active tenant cookie is set', async () => {
    const { NextResponse } = await import('next/server');
    mocks.updateSession.mockImplementation(async (req: NextRequest) => ({
      response: NextResponse.next({ request: { headers: req.headers } }),
      user: { id: 'user-1', email: 'user@example.com' },
    }));

    const middleware = await loadMiddleware();
    const response = await middleware(
      makeRequest('http://localhost/dashboard', { activetenantId: 'tenant-a' }),
    );

    expect(response.headers.get('location')).toBeNull();
  });

  it('does not loop /onboarding -> /onboarding when user has no tenant', async () => {
    const { NextResponse } = await import('next/server');
    mocks.updateSession.mockImplementation(async (req: NextRequest) => ({
      response: NextResponse.next({ request: { headers: req.headers } }),
      user: { id: 'user-1', email: 'user@example.com' },
    }));

    const middleware = await loadMiddleware();
    const response = await middleware(makeRequest('http://localhost/onboarding'));

    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated user on admin route to /login with next param', async () => {
    const { NextResponse } = await import('next/server');
    mocks.updateSession.mockImplementation(async (req: NextRequest) => ({
      response: NextResponse.next({ request: { headers: req.headers } }),
      user: null,
    }));

    const middleware = await loadMiddleware();
    const response = await middleware(makeRequest('http://localhost/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost/login?next=%2Fdashboard',
    );
  });

  it('redirects authenticated user away from /login to /dashboard', async () => {
    const { NextResponse } = await import('next/server');
    mocks.updateSession.mockImplementation(async (req: NextRequest) => ({
      response: NextResponse.next({ request: { headers: req.headers } }),
      user: { id: 'user-1', email: 'user@example.com' },
    }));

    const middleware = await loadMiddleware();
    const response = await middleware(
      makeRequest('http://localhost/login', { activetenantId: 'tenant-a' }),
    );

    expect(response.headers.get('location')).toBe('http://localhost/dashboard');
  });

  it('does not call updateSession on public routes', async () => {
    const middleware = await loadMiddleware();

    for (const path of ['/', '/m/mi-restaurante', '/legal/terms', '/r/abc']) {
      const response = await middleware(makeRequest(`http://localhost${path}`));
      expect(response.headers.get('location')).toBeNull();
    }

    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it('skips auth checks when USE_MOCKS=true', async () => {
    process.env.USE_MOCKS = 'true';

    const middleware = await loadMiddleware();
    const response = await middleware(makeRequest('http://localhost/dashboard'));

    expect(response.headers.get('location')).toBeNull();
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it('preserves the matcher in the Next 15 adapter', async () => {
    const { config } = await import('../../src/middleware');

    expect(config).toEqual({
      matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
    });
  });

  it('sets locale, CSP, and matching request nonce on public routes', async () => {
    const middleware = await loadMiddleware();
    const response = await middleware(makeRequest('http://localhost/m/menu?lang=en'));
    const nonce = response.headers.get('x-middleware-request-x-nonce');

    expect(response.cookies.get('NEXT_LOCALE')?.value).toBe('en');
    expect(response.headers.get('x-middleware-request-x-next-intl-locale')).toBe('en');
    expect(nonce).toBeTruthy();
    expect(response.headers.get('content-security-policy')).toContain(`'nonce-${nonce}'`);
  });
});
