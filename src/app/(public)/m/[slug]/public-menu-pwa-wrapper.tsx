'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  CookieConsentProvider,
  useCookieConsentDecided,
} from '@/components/public/cookie-consent-context';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { localStore } from '@/lib/storage/local';

// Deferred: keeps posthog-js out of the initial public-menu bundle
const CookieConsent = dynamic(
  () => import('@/components/public/cookie-consent').then((m) => m.CookieConsent),
  { ssr: false },
);

// Deferred: loads posthog + fetch tracker after hydration, not on initial paint.
// Must live in a Client Component — `ssr: false` is not allowed in Server Components.
export const PublicMenuTracker = dynamic(
  () => import('@/components/public/public-menu-tracking').then((m) => m.PublicMenuTracker),
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

interface LanguageSwitcherProps {
  activeLocale: PublicMenuLocale;
  ariaLabel: string;
}

export function PublicMenuLanguageSwitcher({ activeLocale: initialLocale, ariaLabel }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const queryLocale = searchParams.get(LANG_QUERY_PARAM);
  const activeLocale = isPublicMenuLocale(queryLocale) ? queryLocale : initialLocale;

  useEffect(() => {
    if (isPublicMenuLocale(queryLocale)) {
      localStore.set('fudi:locale', queryLocale);
      return;
    }

    const storedLocale = localStore.get('fudi:locale');
    if (storedLocale && storedLocale !== initialLocale) {
      startTransition(() => {
        router.replace(getLocalizedHref(pathname, searchParams, storedLocale), { scroll: false });
      });
    }
  }, [initialLocale, pathname, queryLocale, router, searchParams]);

  function switchLocale(nextLocale: PublicMenuLocale) {
    if (nextLocale === activeLocale && queryLocale === nextLocale) return;

    localStore.set('fudi:locale', nextLocale);
    startTransition(() => {
      router.replace(getLocalizedHref(pathname, searchParams, nextLocale), { scroll: false });
    });
  }

  return (
    <div
      className="inline-grid h-9 grid-cols-2 rounded-md border border-[var(--brand-card-border)] bg-[var(--brand-surface)] p-0.5 shadow-sm"
      role="group"
      aria-label={ariaLabel}
    >
      {LOCALES.map((option) => {
        const isActive = option === activeLocale;
        const className = isActive
          ? 'h-8 min-w-10 rounded px-2 text-xs font-extrabold uppercase transition-colors disabled:cursor-wait bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-sm'
          : 'h-8 min-w-10 rounded px-2 text-xs font-extrabold uppercase transition-colors disabled:cursor-wait text-ink-500 hover:bg-[var(--brand-card)] hover:text-ink-900';

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => switchLocale(option)}
            className={className}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface PwaPromptStrings {
  prompt: string;
  install: string;
  close: string;
}

interface PublicMenuPwaWrapperProps {
  slug: string;
  tenantId: string;
  locale: string;
  pwaStrings: PwaPromptStrings;
  children: React.ReactNode;
}

export function PublicMenuPwaWrapper({ slug, tenantId, locale, pwaStrings, children }: PublicMenuPwaWrapperProps) {
  return (
    <CookieConsentProvider>
      <PublicMenuPwaContent slug={slug} tenantId={tenantId} locale={locale} pwaStrings={pwaStrings}>
        {children}
      </PublicMenuPwaContent>
    </CookieConsentProvider>
  );
}

function PublicMenuPwaContent({ slug, tenantId, locale, pwaStrings, children }: PublicMenuPwaWrapperProps) {
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
      <PublicMenuTracker tenantId={tenantId} slug={slug} locale={locale} />
      {children}
      {shouldShowPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-fade-in px-4 pb-4">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-[var(--brand-primary-border)] bg-[var(--brand-card)] p-3 shadow-lg">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
              {pwaStrings.prompt}
            </p>
            <button
              type="button"
              className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md bg-[var(--brand-primary)] px-3 font-semibold text-[var(--brand-on-primary)] shadow-md transition-all hover:bg-[var(--brand-primary-hover)] active:scale-[0.97]"
              onClick={promptInstall}
              aria-label={pwaStrings.install}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-[var(--brand-primary-faint)] hover:text-ink-900 focus-visible:outline-none focus-visible:shadow-glow-mostaza"
              onClick={handleDismiss}
              aria-label={pwaStrings.close}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <CookieConsent />
    </>
  );
}
