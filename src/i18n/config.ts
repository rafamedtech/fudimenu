import { defineRouting } from 'next-intl/routing';

const locales = ['es', 'en'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'es';
export const localeCookieName = 'NEXT_LOCALE';
export const localeQueryParam = 'lang';

const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'never',
  localeCookie: {
    name: localeCookieName,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  },
  alternateLinks: false,
});

function isAppLocale(value: string | null | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}

export function normalizeLocale(value: string | null | undefined): AppLocale | undefined {
  if (!value) return undefined;

  const [locale] = value.toLowerCase().split('-');
  return isAppLocale(locale) ? locale : undefined;
}
