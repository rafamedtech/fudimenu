'use client';

import dynamic from 'next/dynamic';
import { Download, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  CookieConsentProvider,
  useCookieConsentDecided,
} from '@/components/public/cookie-consent-context';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { localStore } from '@/lib/storage/local';

// Deferred: keeps posthog-js out of the initial public-menu bundle
const CookieConsent = dynamic(
  () => import('@/components/public/cookie-consent').then((m) => m.CookieConsent),
  { ssr: false },
);

const PUBLIC_MENU_VISITS_PREFIX = 'fudimenu:public-menu-visits:';
const PUBLIC_MENU_SESSION_PREFIX = 'fudimenu:public-menu-session-counted:';
const PUBLIC_MENU_DISMISSED_PREFIX = 'fudimenu:public-menu-pwa-dismissed:';
const LANG_QUERY_PARAM = 'lang';
const LOCALES = ['es', 'en'] as const;
type PublicMenuLocale = (typeof LOCALES)[number];

function isPublicMenuLocale(value: string | null): value is PublicMenuLocale {
  return value === 'es' || value === 'en';
}

function getLocalizedHref(pathname: string, searchParams: URLSearchParams, locale: PublicMenuLocale) {
  const params = new URLSearchParams(searchParams);
  params.set(LANG_QUERY_PARAM, locale);
  return `${pathname}?${params.toString()}${typeof window === 'undefined' ? '' : window.location.hash}`;
}

export function PublicMenuLanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('menu.language');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeLocale = isPublicMenuLocale(locale) ? locale : 'es';
  const queryLocale = searchParams.get(LANG_QUERY_PARAM);

  useEffect(() => {
    if (isPublicMenuLocale(queryLocale)) {
      localStore.set('fudi:locale', queryLocale);
      return;
    }

    const storedLocale = localStore.get('fudi:locale');
    if (storedLocale) {
      startTransition(() => {
        router.replace(getLocalizedHref(pathname, searchParams, storedLocale), { scroll: false });
      });
    }
  }, [activeLocale, pathname, queryLocale, router, searchParams]);

  function switchLocale(nextLocale: PublicMenuLocale) {
    if (nextLocale === activeLocale && queryLocale === nextLocale) return;

    localStore.set('fudi:locale', nextLocale);
    startTransition(() => {
      router.replace(getLocalizedHref(pathname, searchParams, nextLocale), { scroll: false });
    });
  }

  return (
    <div
      className="inline-grid h-9 grid-cols-2 rounded-md border border-ink-900/10 bg-crema-50 p-0.5 shadow-sm"
      role="group"
      aria-label={t('label')}
    >
      {LOCALES.map((option) => {
        const isActive = option === activeLocale;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => switchLocale(option)}
            className={[
              'h-8 min-w-10 rounded px-2 text-xs font-extrabold uppercase transition-colors disabled:cursor-wait',
              isActive
                ? 'bg-ink-900 text-white shadow-sm'
                : 'text-ink-500 hover:bg-white hover:text-ink-900',
            ].join(' ')}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface PublicMenuPwaWrapperProps {
  slug: string;
  children: React.ReactNode;
}

export function PublicMenuPwaWrapper({ slug, children }: PublicMenuPwaWrapperProps) {
  return (
    <CookieConsentProvider>
      <PublicMenuPwaContent slug={slug}>{children}</PublicMenuPwaContent>
    </CookieConsentProvider>
  );
}

function PublicMenuPwaContent({ slug, children }: PublicMenuPwaWrapperProps) {
  const t = useTranslations('menu');
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const consentDecided = useCookieConsentDecided();
  const [isSecondVisit, setIsSecondVisit] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const visitsKey = `${PUBLIC_MENU_VISITS_PREFIX}${slug}`;
    const sessionKey = `${PUBLIC_MENU_SESSION_PREFIX}${slug}`;
    const dismissedKey = `${PUBLIC_MENU_DISMISSED_PREFIX}${slug}`;
    const visits = Number(localStorage.getItem(visitsKey) ?? '0');
    const hasCountedSession = sessionStorage.getItem(sessionKey) === '1';
    const nextVisits = hasCountedSession ? visits : visits + 1;

    if (!hasCountedSession) {
      localStorage.setItem(visitsKey, String(nextVisits));
      sessionStorage.setItem(sessionKey, '1');
    }

    setIsSecondVisit(nextVisits >= 2);
    setIsDismissed(localStorage.getItem(dismissedKey) === '1');
  }, [slug]);

  const shouldShowPrompt =
    canInstall && !isInstalled && isSecondVisit && !isDismissed && consentDecided;

  const handleDismiss = () => {
    localStorage.setItem(`${PUBLIC_MENU_DISMISSED_PREFIX}${slug}`, '1');
    setIsDismissed(true);
  };

  return (
    <>
      {children}
      {shouldShowPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-fade-in px-4 pb-4">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-mostaza-500/30 bg-white p-3 shadow-lg">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
              {t('pwaPrompt')}
            </p>
            <Button
              type="button"
              size="sm"
              className="min-h-10 min-w-10 shrink-0 px-3"
              onClick={promptInstall}
              aria-label={t('pwaInstall')}
            >
              <Download size={18} aria-hidden />
            </Button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:shadow-glow-mostaza"
              onClick={handleDismiss}
              aria-label={t('pwaClose')}
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}
      <CookieConsent />
    </>
  );
}
