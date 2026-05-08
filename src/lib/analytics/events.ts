'use client';
import posthog from 'posthog-js';

let initialized = false;

export const ANALYTICS_CONSENT_KEY = 'fudi:consent';
export type AnalyticsConsent = 'accepted' | 'declined';

export function getStoredAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const consent = getStoredAnalyticsConsent();
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    opt_out_capturing_by_default: consent !== 'accepted',
    opt_out_persistence_by_default: consent !== 'accepted',
    opt_out_capturing_persistence_type: 'localStorage',
  });
  initialized = true;
}

export function acceptAnalyticsConsent() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted');
  }
  posthog.opt_in_capturing();
}

export function declineAnalyticsConsent() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'declined');
  }
  posthog.opt_out_capturing();
}

export type AnalyticsEvent =
  | { name: 'menu_viewed'; props: { tenantId: string; branchId?: string } }
  | { name: 'item_viewed'; props: { itemId: string; category?: string } }
  | { name: 'item_created'; props: { itemId: string } }
  | { name: 'item_edited'; props: { itemId: string; field: string } }
  | { name: 'stock_toggled'; props: { itemId: string; available: boolean } }
  | { name: 'qr_downloaded'; props: { tenantId: string; format: 'png' | 'pdf' } }
  | { name: 'whatsapp_clicked'; props: { itemId: string } }
  | { name: 'onboarding_step'; props: { step: number } }
  | { name: 'onboarding_completed'; props: { tenantId: string } }
  | { name: 'plan_upgrade_started'; props: { from: string; to: string } }
  | { name: 'plan_upgraded'; props: { from: string; to: string } };

export function track<E extends AnalyticsEvent>(
  name: E['name'],
  props: Extract<AnalyticsEvent, { name: E['name'] }>['props'],
) {
  if (!initialized) return;
  posthog.capture(name, props as Record<string, unknown>);
}

export function identify(userId: string, traits: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}
