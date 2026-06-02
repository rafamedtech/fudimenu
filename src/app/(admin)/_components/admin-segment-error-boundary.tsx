'use client';

import * as Sentry from '@sentry/nextjs';
import { RotateCcw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

type AdminSegmentErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
  segment: 'dashboard' | 'menu' | 'analytics';
  title: string;
  description: string;
};

export function AdminSegmentErrorBoundary({
  error,
  reset,
  segment,
  title,
  description,
}: AdminSegmentErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        area: 'admin',
        routeSegment: segment,
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error, segment]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-md bg-[var(--brand-card)] px-4 py-2 text-sm font-semibold text-coral-700 shadow-sm">
        Error
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        <p className="text-sm leading-6 text-ink-500">{description}</p>
      </div>
      <Button onClick={reset}>
        <RotateCcw className="size-4" aria-hidden />
        Reintentar
      </Button>
    </main>
  );
}
