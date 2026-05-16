'use client';
import posthog from 'posthog-js';
import {
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsent,
  getStoredAnalyticsConsent,
} from './consent';

export { ANALYTICS_CONSENT_KEY, type AnalyticsConsent, getStoredAnalyticsConsent };

type PendingAnalyticsEvent = { name: AnalyticsEvent['name']; props: Record<string, unknown> };

declare global {
  interface Window {
    __fudiAnalyticsInitialized?: boolean;
    __fudiAnalyticsPendingEvents?: PendingAnalyticsEvent[];
  }
}

function isInitialized() {
  return typeof window !== 'undefined' && window.__fudiAnalyticsInitialized === true;
}

function setInitialized() {
  window.__fudiAnalyticsInitialized = true;
}

function getPendingEvents() {
  window.__fudiAnalyticsPendingEvents ??= [];
  return window.__fudiAnalyticsPendingEvents;
}

function isLocalAnalyticsHost() {
  const { hostname } = window.location;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function initAnalytics() {
  if (typeof window === 'undefined' || isInitialized()) return;
  if (isLocalAnalyticsHost()) return;
  if (!hasAnalyticsConsent()) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    request_batching: false,
    opt_out_useragent_filter: process.env.NODE_ENV !== 'production',
    persistence: 'localStorage',
    opt_out_capturing_by_default: false,
    opt_out_persistence_by_default: false,
    opt_out_capturing_persistence_type: 'localStorage',
  });
  setInitialized();
}

function hasAnalyticsConsent() {
  return getStoredAnalyticsConsent() === 'accepted';
}

function flushPendingEvents() {
  if (!isInitialized() || !hasAnalyticsConsent()) return;
  const pendingEvents = getPendingEvents();
  while (pendingEvents.length > 0) {
    const event = pendingEvents.shift()!;
    posthog.capture(event.name, event.props);
  }
}

export function acceptAnalyticsConsent() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted');
  }
  if (!isInitialized()) initAnalytics();
  if (isInitialized()) posthog.opt_in_capturing();
  flushPendingEvents();
}

export function declineAnalyticsConsent() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'declined');
  }
  if (isInitialized()) posthog.opt_out_capturing();
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
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) {
    getPendingEvents().push({ name, props: props as Record<string, unknown> });
    return;
  }
  if (!isInitialized()) initAnalytics();
  if (!isInitialized()) return;
  posthog.capture(name, props as Record<string, unknown>);
}

export function identify(userId: string, traits: Record<string, unknown>) {
  if (!isInitialized()) return;
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  if (!isInitialized()) return;
  posthog.reset();
}
