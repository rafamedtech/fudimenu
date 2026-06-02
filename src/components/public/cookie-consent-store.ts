import { getStoredAnalyticsConsent } from '@/lib/analytics/consent';

const COOKIE_CONSENT_DECIDED_EVENT = 'fudi:cookie-consent-decided';

export function notifyCookieConsentDecided() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_DECIDED_EVENT));
}

export function subscribeToCookieConsent(onStoreChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_DECIDED_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_DECIDED_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function getCookieConsentSnapshot() {
  return getStoredAnalyticsConsent() !== null;
}

export function getCookieConsentServerSnapshot() {
  return false;
}
