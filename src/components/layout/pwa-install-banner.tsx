'use client';

import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const ADMIN_VISITS_KEY = 'fudimenu:admin-visits';
const ADMIN_SESSION_COUNTED_KEY = 'fudimenu:admin-session-counted';
const ADMIN_PWA_DISMISSED_KEY = 'fudimenu:admin-pwa-dismissed-session';

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

export function PwaInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [isEligibleSession, setIsEligibleSession] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsMobile(isMobilePlatform());
    setIsDismissed(sessionStorage.getItem(ADMIN_PWA_DISMISSED_KEY) === '1');

    const visits = Number(localStorage.getItem(ADMIN_VISITS_KEY) ?? '0');
    const hasCountedSession = sessionStorage.getItem(ADMIN_SESSION_COUNTED_KEY) === '1';
    const nextVisits = hasCountedSession ? visits : visits + 1;

    if (!hasCountedSession) {
      localStorage.setItem(ADMIN_VISITS_KEY, String(nextVisits));
      sessionStorage.setItem(ADMIN_SESSION_COUNTED_KEY, '1');
    }

    setIsEligibleSession(nextVisits >= 2);
  }, []);

  if (!canInstall || isInstalled || !isMobile || !isEligibleSession || isDismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(ADMIN_PWA_DISMISSED_KEY, '1');
    setIsDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-[88px] z-40 px-4 pb-3">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-ink-100 bg-white p-3 shadow-lg">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
          Agrega FudiMenu a tu inicio — acceso en 1 tap 📱
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
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-none focus-visible:shadow-glow-mostaza"
          onClick={handleDismiss}
          aria-label="Cerrar sugerencia"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}
