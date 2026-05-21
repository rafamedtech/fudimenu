'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

const prefetchedRoutes = new Set<string>();

function canPrefetchRoute(href: string) {
  return href.startsWith('/') && !href.startsWith('/m/') && !href.startsWith('/api/');
}

export function usePrefetchRoute() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      if (!canPrefetchRoute(href) || prefetchedRoutes.has(href)) return;

      prefetchedRoutes.add(href);
      router.prefetch(href);
    },
    [router],
  );
}

export function getIntentPrefetchHandlers(href: string, prefetchRoute: (href: string) => void) {
  return {
    onFocus: () => prefetchRoute(href),
    onMouseEnter: () => prefetchRoute(href),
  };
}
