'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  acceptAnalyticsConsent,
  declineAnalyticsConsent,
  getStoredAnalyticsConsent,
} from '@/lib/analytics/events';
import { notifyCookieConsentDecided } from '@/components/public/cookie-consent-context';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(getStoredAnalyticsConsent() === null);
  }, []);

  const handleAccept = () => {
    acceptAnalyticsConsent();
    setIsVisible(false);
    notifyCookieConsentDecided();
  };

  const handleDecline = () => {
    declineAnalyticsConsent();
    setIsVisible(false);
    notifyCookieConsentDecided();
  };

  if (!isVisible) return null;

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
      aria-label="Consentimiento de cookies"
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 rounded-md border border-ink-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
          Usamos cookies para entender qué ven en este menú.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Button type="button" size="sm" className="min-h-10 px-4" onClick={handleAccept}>
            OK
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 px-4"
            onClick={handleDecline}
          >
            No, gracias
          </Button>
        </div>
      </div>
    </section>
  );
}
