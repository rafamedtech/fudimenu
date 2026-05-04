import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, localeCookieName, normalizeLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();
  const locale =
    normalizeLocale(await requestLocale) ??
    normalizeLocale(cookieStore.get(localeCookieName)?.value) ??
    defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
