'use client';
import posthog from 'posthog-js';
import {
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsent,
  getStoredAnalyticsConsent,
} from './consent';

export { ANALYTICS_CONSENT_KEY, type AnalyticsConsent, getStoredAnalyticsConsent };

let initialized = false;

function isLocalAnalyticsHost() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  if (isLocalAnalyticsHost()) return;
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
  if (initialized) posthog.opt_in_capturing();
}

export function declineAnalyticsConsent() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'declined');
  }
  if (initialized) posthog.opt_out_capturing();
}

export type AnalyticsEvent =
  | { name: 'menu_viewed'; props: { tenantId: string; branchId?: string } }
  | { name: 'item_viewed'; props: { itemId: string; category?: string } }
  | { name: 'item_created'; props: { itemId: string } }
  | { name: 'item_edited'; props: { itemId: string; field: string } }
  | { name: 'stock_toggled'; props: { itemId: string; available: boolean } }
  | { name: 'qr_downloaded'; props: { tenantId: string; format: 'png' | 'pdf' } }
  | { name: 'qr_menu_link_copied'; props: { tenantId: string } }
  | { name: 'qr_menu_link_shared'; props: { tenantId: string } }
  | { name: 'whatsapp_clicked'; props: { itemId: string } }
  | { name: 'onboarding_step'; props: { step: number } }
  | { name: 'onboarding_completed'; props: { tenantId: string } }
  | { name: 'plan_upgrade_started'; props: { from: string; to: string; method: 'card' | 'cash'; cycle: 'monthly' | 'annual' } }
  | { name: 'plan_upgraded'; props: { from: string; to: string } }
  | { name: 'login_magic_link_sent'; props: { email_domain: string } }
  | { name: 'login_google_started'; props: Record<string, never> }
  | { name: 'account_deleted'; props: Record<string, never> }
  | { name: 'data_exported'; props: Record<string, never> };

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
