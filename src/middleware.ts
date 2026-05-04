import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ADMIN_PREFIXES = ['/dashboard', '/menu', '/categories', '/branches', '/analytics', '/settings', '/onboarding'];
const AUTH_PREFIXES = ['/login', '/signup', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const useMocks = process.env.USE_MOCKS === 'true';
  const useE2eAuth = process.env.E2E_TEST_AUTH === 'true';
  const { pathname } = request.nextUrl;

  if (useMocks) return NextResponse.next();

  if (useE2eAuth && request.cookies.get('e2e_user_id')?.value) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|m/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
