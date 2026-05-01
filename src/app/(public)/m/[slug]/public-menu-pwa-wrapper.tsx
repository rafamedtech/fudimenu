'use client';

import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

const PUBLIC_MENU_VISITS_PREFIX = 'fudimenu:public-menu-visits:';
const PUBLIC_MENU_SESSION_PREFIX = 'fudimenu:public-menu-session-counted:';
const PUBLIC_MENU_DISMISSED_PREFIX = 'fudimenu:public-menu-pwa-dismissed:';

interface PublicMenuPwaWrapperProps {
  slug: string;
  children: React.ReactNode;
}

export function PublicMenuPwaWrapper({ slug, children }: PublicMenuPwaWrapperProps) {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
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

  const shouldShowPrompt = canInstall && !isInstalled && isSecondVisit && !isDismissed;

  const handleDismiss = () => {
    localStorage.setItem(`${PUBLIC_MENU_DISMISSED_PREFIX}${slug}`, '1');
    setIsDismissed(true);
  };

  return (
    <>
      {children}
      {shouldShowPrompt && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-md border border-mostaza-500/30 bg-white p-3 shadow-lg">
            <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
              Guarda este menú en tu inicio — acceso en 1 tap 📱
            </p>
            <Button
              type="button"
              size="sm"
              className="min-h-10 min-w-10 shrink-0 px-3"
              onClick={promptInstall}
              aria-label="Agregar menú a inicio"
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
      )}
    </>
  );
}
