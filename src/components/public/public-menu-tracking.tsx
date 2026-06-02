'use client';

import { useEffect } from 'react';
import { initAnalytics, track } from '@/lib/analytics/events';

const SESSION_KEY = 'fudimenu:public-session-id';

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
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
    initAnalytics();

    const sessionId = getSessionId();
    track('menu_viewed', { tenantId });
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
          track('item_viewed', { itemId, category: el.dataset.itemCategory });
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    document.querySelectorAll<HTMLElement>('[data-item-id]').forEach((el) => observer.observe(el));

    // whatsapp_clicked via event delegation — avoids client boundary on every card
    function onWaClick(e: MouseEvent) {
      const el = (e.target as Element).closest<HTMLElement>('[data-track-wa]');
      if (!el) return;
      track('whatsapp_clicked', { itemId: el.dataset.trackWa! });
    }

    document.addEventListener('click', onWaClick);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', onWaClick);
    };
  }, [locale, slug, tenantId]);

  return null;
}
