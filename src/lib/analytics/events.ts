'use client';
import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
  });
  initialized = true;
}

export type AnalyticsEvent =
  | { name: 'menu_viewed'; props: { tenantId: string; branchId?: string } }
  | { name: 'item_viewed'; props: { itemId: string; category?: string } }
  | { name: 'item_created'; props: { itemId: string } }
  | { name: 'item_edited'; props: { itemId: string; field: string } }
  | { name: 'stock_toggled'; props: { itemId: string; available: boolean } }
  | { name: 'qr_downloaded'; props: { tenantId: string; format: 'png' | 'pdf' } }
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
