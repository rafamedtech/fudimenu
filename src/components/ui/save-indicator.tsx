'use client';

import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type SaveIndicatorStatus = 'idle' | 'saving' | 'saved';

interface SaveIndicatorProps {
  status: SaveIndicatorStatus;
  className?: string;
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const [visibleStatus, setVisibleStatus] = useState<SaveIndicatorStatus>('idle');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      setVisibleStatus('idle');
      setIsFading(false);
      return;
    }

    setVisibleStatus(status);
    setIsFading(false);

    if (status !== 'saved') return;

    const fadeTimer = setTimeout(() => setIsFading(true), 1000);
    const hideTimer = setTimeout(() => setVisibleStatus('idle'), 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [status]);

  if (visibleStatus === 'idle') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex h-7 items-center gap-2 rounded-full bg-[var(--brand-card)] px-3 text-xs font-semibold text-ink-700 shadow-sm ring-1 ring-ink-100 transition-opacity duration-200',
        isFading && 'opacity-0',
        className,
      )}
    >
      {visibleStatus === 'saving' ? (
        <>
          <span
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Guardando...</span>
        </>
      ) : (
        <Check className="h-3 w-3 text-menta-500" aria-hidden="true" />
      )}
    </div>
  );
}
