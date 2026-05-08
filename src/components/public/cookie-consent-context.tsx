'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getStoredAnalyticsConsent } from '@/lib/analytics/consent';

const COOKIE_CONSENT_DECIDED_EVENT = 'fudi:cookie-consent-decided';

const CookieConsentContext = createContext<{ decided: boolean }>({ decided: false });

export function notifyCookieConsentDecided() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_DECIDED_EVENT));
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    const syncConsent = () => {
      setDecided(getStoredAnalyticsConsent() !== null);
    };

    syncConsent();
    window.addEventListener(COOKIE_CONSENT_DECIDED_EVENT, syncConsent);
    window.addEventListener('storage', syncConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_DECIDED_EVENT, syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  return (
    <CookieConsentContext.Provider value={{ decided }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsentDecided() {
  return useContext(CookieConsentContext).decided;
}
