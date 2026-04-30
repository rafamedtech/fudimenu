import 'server-only';

export const ACTIVE_TENANT_COOKIE = 'activetenantId';

export const activeTenantCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 90,
};
