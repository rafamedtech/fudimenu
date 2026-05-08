'use client';

export const ANALYTICS_CONSENT_KEY = 'fudi:consent';
export type AnalyticsConsent = 'accepted' | 'declined';

export function getStoredAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}
