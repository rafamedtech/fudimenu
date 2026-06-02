'use client';

import { createContext, use, useMemo, useSyncExternalStore } from 'react';
import {
  getCookieConsentServerSnapshot,
  getCookieConsentSnapshot,
  subscribeToCookieConsent,
} from '@/components/public/cookie-consent-store';

const CookieConsentContext = createContext<{ decided: boolean }>({ decided: false });

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const decided = useSyncExternalStore(
    subscribeToCookieConsent,
    getCookieConsentSnapshot,
    getCookieConsentServerSnapshot,
  );
  const value = useMemo(() => ({ decided }), [decided]);

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsentDecided() {
  return use(CookieConsentContext).decided;
}
