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
const LOCALE_HEADER_NAME = 'X-NEXT-INTL-LOCALE';

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

export async function middleware(request: NextRequest) {
  const useMocks = process.env.USE_MOCKS === 'true';
  const useE2eAuth = process.env.E2E_TEST_AUTH === 'true';
  const { pathname } = request.nextUrl;
  const locale = resolveLocale(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER_NAME, locale);

  const createResponse = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    setLocaleCookie(response, locale);
    return response;
  };

  if (useMocks) return createResponse();

  if (useE2eAuth && request.cookies.get('e2e_user_id')?.value) {
    return createResponse();
  }

  const { response, user } = await updateSession(request, requestHeaders);
  setLocaleCookie(response, locale);

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    const redirectResponse = NextResponse.redirect(url);
    setLocaleCookie(redirectResponse, locale);
    return redirectResponse;
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(url);
    setLocaleCookie(redirectResponse, locale);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
