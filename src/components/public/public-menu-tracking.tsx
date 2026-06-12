'use client';

import { useEffect } from 'react';
import { initAnalytics, track } from '@/lib/analytics/events';
import { rememberTrafficSource } from '@/lib/analytics/traffic-source';
import { getDeviceType } from '@/lib/analytics/device';

const SESSION_KEY = 'fudimenu:public-session-id';
let fallbackSessionId: string | null = null;

function getSafeSessionStorageItem(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSafeSessionStorageItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in restricted contexts; analytics should not crash the menu.
  }
}

function getSessionId() {
  let id = getSafeSessionStorageItem(SESSION_KEY) ?? fallbackSessionId;
  if (!id) {
    id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    fallbackSessionId = id;
    setSafeSessionStorageItem(SESSION_KEY, id);
  }
  return id;
}

// Tracks which item IDs have already fired item_viewed this session.
const viewedItems = new Set<string>();

function recordMenuView(payload: {
  tenantId: string;
  slug: string;
  sessionId: string;
  locale: string;
  referrer: string | null;
}) {
  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });
  if (navigator.sendBeacon('/api/track/view', blob)) return;

  void fetch('/api/track/view', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  });
}

export function PublicMenuTracker({ tenantId, slug, locale }: { tenantId: string; slug: string; locale: string }) {
  useEffect(() => {
    // Dentro de un iframe (vista previa del admin) no se trackea: contaminaría analytics.
    if (window.self !== window.top) return;

    initAnalytics();

    const sessionId = getSessionId();
    const trafficSource = rememberTrafficSource(window.location.search);
    track('menu_viewed', { tenantId, ...trafficSource });
    recordMenuView({
      tenantId,
      slug,
      sessionId,
      locale,
      referrer: document.referrer || null,
    });

    // item_viewed via Intersection Observer — fires once per item per session
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const itemId = el.dataset.itemId;
          if (!itemId || viewedItems.has(itemId)) continue;
          viewedItems.add(itemId);
          track('item_viewed', { itemId, category: el.dataset.itemCategory, ...trafficSource });
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    document.querySelectorAll<HTMLElement>('[data-item-id]').forEach((el) => observer.observe(el));

    // whatsapp_clicked via event delegation — avoids client boundary on every card
    const waLocale = locale === 'en' ? 'en' : 'es';
    const device = getDeviceType(navigator.userAgent);
    function onWaClick(e: MouseEvent) {
      const el = (e.target as Element).closest<HTMLElement>('[data-track-wa]');
      if (!el) return;
      track('whatsapp_clicked', {
        tenantId,
        itemId: el.dataset.trackWa!,
        locale: waLocale,
        device,
        ...trafficSource,
      });
    }

    document.addEventListener('click', onWaClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onWaClick);
    };
  }, [locale, slug, tenantId]);

  return null;
}
