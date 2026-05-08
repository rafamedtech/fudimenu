'use client';

import { useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { track } from '@/lib/analytics/events';

const SESSION_KEY = 'fudimenu:public-session-id';

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function PublicMenuTracker({ tenantId, slug }: { tenantId: string; slug: string }) {
  const locale = useLocale();

  useEffect(() => {
    const sessionId = getSessionId();
    track('menu_viewed', { tenantId });
    void fetch('/api/track/view', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        slug,
        sessionId,
        locale,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    });
  }, [locale, slug, tenantId]);

  return null;
}

export function WhatsAppOrderLink({
  href,
  itemId,
  children,
  className,
}: {
  href: string;
  itemId: string;
  children: React.ReactNode;
  className?: string;
}) {
  const props = useMemo(() => ({ itemId }), [itemId]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track('whatsapp_clicked' as never, props as never)}
    >
      {children}
    </a>
  );
}
