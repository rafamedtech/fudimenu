'use client';

import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useSyncExternalStore, useTransition } from 'react';
import type { CSSProperties } from 'react';
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

// Deferred: loads posthog + fetch tracker after hydration, not on initial paint.
// Must live in a Client Component — `ssr: false` is not allowed in Server Components.
const PublicMenuTracker = dynamic(
  () => import('@/components/public/public-menu-tracking').then((m) => m.PublicMenuTracker),
  { ssr: false },
);

const PUBLIC_MENU_VISITS_PREFIX = 'fudimenu:public-menu-visits:';
const PUBLIC_MENU_SESSION_PREFIX = 'fudimenu:public-menu-session-counted:';
const PUBLIC_MENU_DISMISSED_PREFIX = 'fudimenu:public-menu-pwa-dismissed:';
const PUBLIC_MENU_PWA_STATE_EVENT = 'fudimenu:public-menu-pwa-state';
const PUBLIC_MENU_PWA_SERVER_SNAPSHOT = 'false|false';
const LANG_QUERY_PARAM = 'lang';
const LOCALES = ['es', 'en'] as const;
type PublicMenuLocale = (typeof LOCALES)[number];

function getLocalizedHref(pathname: string, locale: PublicMenuLocale) {
  const params = new URLSearchParams();
  params.set(LANG_QUERY_PARAM, locale);
  return `${pathname}?${params.toString()}${typeof window === 'undefined' ? '' : window.location.hash}`;
}

function subscribeToPublicMenuPwaState(onStoreChange: () => void) {
  window.addEventListener(PUBLIC_MENU_PWA_STATE_EVENT, onStoreChange);
  return () => window.removeEventListener(PUBLIC_MENU_PWA_STATE_EVENT, onStoreChange);
}

function getPublicMenuPwaSnapshot(slug: string) {
  const visits = Number(localStorage.getItem(`${PUBLIC_MENU_VISITS_PREFIX}${slug}`) ?? '0');
  const dismissed = localStorage.getItem(`${PUBLIC_MENU_DISMISSED_PREFIX}${slug}`) === '1';
  return `${visits >= 2}|${dismissed}`;
}

function recordPublicMenuVisit(slug: string) {
  const visitsKey = `${PUBLIC_MENU_VISITS_PREFIX}${slug}`;
  const sessionKey = `${PUBLIC_MENU_SESSION_PREFIX}${slug}`;
  const visits = Number(localStorage.getItem(visitsKey) ?? '0');
  const hasCountedSession = sessionStorage.getItem(sessionKey) === '1';
  if (!hasCountedSession) {
    localStorage.setItem(visitsKey, String(visits + 1));
    sessionStorage.setItem(sessionKey, '1');
  }
  window.dispatchEvent(new Event(PUBLIC_MENU_PWA_STATE_EVENT));
}

interface LanguageSwitcherProps {
  activeLocale: PublicMenuLocale;
  ariaLabel: string;
}

export function PublicMenuLanguageSwitcher({ activeLocale: initialLocale, ariaLabel }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeLocale = initialLocale;

  function switchLocale(nextLocale: PublicMenuLocale) {
    if (nextLocale === activeLocale) return;

    localStore.set('fudi:locale', nextLocale);
    startTransition(() => {
      router.replace(getLocalizedHref(pathname, nextLocale), { scroll: false });
    });
  }

  return (
    <fieldset
      className="inline-grid h-10 grid-cols-2 gap-1 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-1 shadow-sm"
    >
      <legend className="sr-only">{ariaLabel}</legend>
      {LOCALES.map((option) => {
        const isActive = option === activeLocale;
        const className = isActive
          ? 'flex h-8 min-w-10 items-center justify-center rounded-lg border-2 border-[var(--brand-primary)] bg-[var(--brand-primary-faint)] px-2 text-xs font-extrabold uppercase text-ink-900 transition-colors disabled:cursor-wait'
          : 'flex h-8 min-w-10 items-center justify-center rounded-lg border-2 border-transparent px-2 text-xs font-extrabold uppercase text-ink-500 transition-colors hover:text-ink-900 disabled:cursor-wait';

        return (
          <Button
            key={option}
            type="button"
            variant={isActive ? 'outline' : 'ghost'}
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => switchLocale(option)}
            className={className}
          >
            {option}
          </Button>
        );
      })}
    </fieldset>
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
  brandThemeStyle?: CSSProperties;
  children: React.ReactNode;
}

export function PublicMenuPwaWrapper({
  slug,
  tenantId,
  locale,
  pwaStrings,
  brandThemeStyle,
  children,
}: PublicMenuPwaWrapperProps) {
  return (
    <CookieConsentProvider>
      <div style={brandThemeStyle}>
        <PublicMenuPwaContent slug={slug} tenantId={tenantId} locale={locale} pwaStrings={pwaStrings}>
          {children}
        </PublicMenuPwaContent>
      </div>
    </CookieConsentProvider>
  );
}

function PublicMenuPwaContent({ slug, tenantId, locale, pwaStrings, children }: PublicMenuPwaWrapperProps) {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const consentDecided = useCookieConsentDecided();
  const getSnapshot = useCallback(() => getPublicMenuPwaSnapshot(slug), [slug]);
  const snapshot = useSyncExternalStore(
    subscribeToPublicMenuPwaState,
    getSnapshot,
    () => PUBLIC_MENU_PWA_SERVER_SNAPSHOT,
  );
  const [isSecondVisit, isDismissed] = snapshot.split('|').map((value) => value === 'true');

  useEffect(() => {
    recordPublicMenuVisit(slug);
  }, [slug]);

  const shouldShowPrompt =
    canInstall && !isInstalled && isSecondVisit && !isDismissed && consentDecided;

  const handleDismiss = () => {
    localStorage.setItem(`${PUBLIC_MENU_DISMISSED_PREFIX}${slug}`, '1');
    window.dispatchEvent(new Event(PUBLIC_MENU_PWA_STATE_EVENT));
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
            <Button
              type="button"
              className="min-h-10 min-w-10 shrink-0 px-3 font-semibold"
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
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 text-ink-500 hover:text-ink-900"
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
            </Button>
          </div>
        </div>
      )}
      <CookieConsent />
    </>
  );
}
