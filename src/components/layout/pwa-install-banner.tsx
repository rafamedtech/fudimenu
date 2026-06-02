'use client';

import { Download, X } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const ADMIN_VISITS_KEY = 'fudimenu:admin-visits';
const ADMIN_SESSION_COUNTED_KEY = 'fudimenu:admin-session-counted';
const ADMIN_PWA_DISMISSED_KEY = 'fudimenu:admin-pwa-dismissed-session';
const ADMIN_PWA_STATE_EVENT = 'fudimenu:admin-pwa-state';
const ADMIN_PWA_SERVER_SNAPSHOT = 'false|false|false';

function isMobilePlatform() {
  const navigatorWithUserAgentData = window.navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  if (typeof navigatorWithUserAgentData.userAgentData?.mobile === 'boolean') {
    return navigatorWithUserAgentData.userAgentData.mobile;
  }

  return (
    window.matchMedia('(pointer: coarse)').matches &&
    window.matchMedia('(max-width: 768px)').matches
  );
}

function subscribeToAdminPwaState(onStoreChange: () => void) {
  window.addEventListener(ADMIN_PWA_STATE_EVENT, onStoreChange);
  return () => window.removeEventListener(ADMIN_PWA_STATE_EVENT, onStoreChange);
}

function getAdminPwaSnapshot() {
  const visits = Number(localStorage.getItem(ADMIN_VISITS_KEY) ?? '0');
  const dismissed = sessionStorage.getItem(ADMIN_PWA_DISMISSED_KEY) === '1';
  return `${isMobilePlatform()}|${visits >= 2}|${dismissed}`;
}

function recordAdminVisit() {
  const visits = Number(localStorage.getItem(ADMIN_VISITS_KEY) ?? '0');
  const hasCountedSession = sessionStorage.getItem(ADMIN_SESSION_COUNTED_KEY) === '1';
  if (!hasCountedSession) {
    localStorage.setItem(ADMIN_VISITS_KEY, String(visits + 1));
    sessionStorage.setItem(ADMIN_SESSION_COUNTED_KEY, '1');
  }
  window.dispatchEvent(new Event(ADMIN_PWA_STATE_EVENT));
}

function dismissAdminPwaPrompt() {
  sessionStorage.setItem(ADMIN_PWA_DISMISSED_KEY, '1');
  window.dispatchEvent(new Event(ADMIN_PWA_STATE_EVENT));
}

export function PwaInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const snapshot = useSyncExternalStore(
    subscribeToAdminPwaState,
    getAdminPwaSnapshot,
    () => ADMIN_PWA_SERVER_SNAPSHOT,
  );
  const [isMobile, isEligibleSession, isDismissed] = snapshot
    .split('|')
    .map((value) => value === 'true');

  useEffect(() => {
    recordAdminVisit();
  }, []);

  if (!canInstall || isInstalled || !isMobile || !isEligibleSession || isDismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-40 px-4 pb-3 ipad:bottom-[96px]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-ink-100 bg-[var(--brand-card)] p-3 shadow-lg ipad:max-w-[744px] ipad:px-4 ipad:py-3.5 ipad-landscape:max-w-[984px] desktop:max-w-[1180px]">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
          Agrega FudiMenu a tu inicio: acceso en 1 tap 📱
        </p>
        <Button
          type="button"
          size="sm"
          className="min-h-10 min-w-10 shrink-0 px-3"
          onClick={promptInstall}
          aria-label="Agregar FudiMenu a inicio"
        >
          <Download size={18} aria-hidden />
        </Button>
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:shadow-glow-mostaza"
          onClick={dismissAdminPwaPrompt}
          aria-label="Cerrar sugerencia"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
