import type { NextRequest } from 'next/server';
import { requestProxy } from '@/server/request-proxy';

export async function middleware(request: NextRequest) {
  return requestProxy(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
