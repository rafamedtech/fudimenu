import { NextResponse, type NextRequest } from 'next/server';
import {
  defaultLocale,
  localeCookieName,
  localeQueryParam,
  normalizeLocale,
  type AppLocale,
} from '@/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

const ADMIN_PREFIXES = ['/dashboard', '/menu', '/categories', '/branches', '/analytics', '/settings', '/qr', '/account', '/onboarding'];
const AUTH_PREFIXES = ['/login', '/signup', '/forgot-password'];
const ONBOARDING_PATH = '/onboarding';
const ACTIVE_TENANT_COOKIE_NAME = 'activetenantId';
const LOCALE_HEADER_NAME = 'X-NEXT-INTL-LOCALE';

function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === 'development';
  const devConnectSrc = isDev
    ? ' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*'
    : '';

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ''} https://us.i.posthog.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.supabase.co https://api.stripe.com https://us.i.posthog.com https://*.sentry.io wss://*.supabase.co${devConnectSrc}`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com`,
  ].join('; ');
}

function resolveLocale(request: NextRequest): AppLocale {
  return (
    normalizeLocale(request.nextUrl.searchParams.get(localeQueryParam)) ??
    normalizeLocale(request.cookies.get(localeCookieName)?.value) ??
    normalizeLocale(request.headers.get('accept-language')?.split(',')[0]) ??
    defaultLocale
  );
}

function setLocaleCookie(response: NextResponse, locale: AppLocale) {
  response.cookies.set(localeCookieName, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
}

function applyResponseHeaders(response: NextResponse, locale: AppLocale, nonce: string) {
  setLocaleCookie(response, locale);
  response.headers.set('Content-Security-Policy', buildCsp(nonce));
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export async function middleware(request: NextRequest) {
  const useMocks = process.env.USE_MOCKS === 'true';
  const useE2eAuth = process.env.E2E_TEST_AUTH === 'true';
  const { pathname } = request.nextUrl;
  const locale = resolveLocale(request);
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, locale);
  requestHeaders.set('x-nonce', nonce);

  const createResponse = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return applyResponseHeaders(response, locale, nonce);
  };

  if (useMocks) return createResponse();

  if (useE2eAuth && request.cookies.get('e2e_user_id')?.value) {
    return createResponse();
  }

  const { response, user } = await updateSession(request, requestHeaders);
  applyResponseHeaders(response, locale, nonce);

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirectResponse = NextResponse.redirect(url);
    return applyResponseHeaders(redirectResponse, locale, nonce);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    return applyResponseHeaders(redirectResponse, locale, nonce);
  }

  if (
    user &&
    isAdminRoute &&
    !pathname.startsWith(ONBOARDING_PATH) &&
    !request.cookies.get(ACTIVE_TENANT_COOKIE_NAME)?.value
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_PATH;
    url.search = '';
    const redirectResponse = NextResponse.redirect(url);
    return applyResponseHeaders(redirectResponse, locale, nonce);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
