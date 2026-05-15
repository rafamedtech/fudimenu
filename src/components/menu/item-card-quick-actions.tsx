'use client';

import type { ReactNode } from 'react';
import { useCallback, useState, useTransition } from 'react';
import { CheckCircle2, CircleSlash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import { track } from '@/lib/analytics/events';
import { ApiError, toUserMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/use-long-press';

interface ItemCardQuickActionsProps {
  children: ReactNode;
  itemId: string;
  initialAvailable: boolean;
}

export function ItemCardQuickActions({
  children,
  itemId,
  initialAvailable,
}: ItemCardQuickActionsProps) {
  const locale = useLocale();
  const t = useTranslations('menu');
  const [available, setAvailable] = useState(initialAvailable);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const { longPressHandlers } = useLongPress({ onLongPress: openMenu });

  const nextAvailable = !available;
  const actionLabel = nextAvailable ? t('available') : t('soldOut');
  const ActionIcon = nextAvailable ? CheckCircle2 : CircleSlash2;

  function handleToggleStock() {
    const previous = available;
    setAvailable(nextAvailable);
    setIsMenuOpen(false);
    track('stock_toggled', { itemId, available: nextAvailable });

    startTransition(async () => {
      try {
        const res = await toggleItemAvailabilityAction(itemId, nextAvailable);
        if (!res.ok) {
          setAvailable(previous);
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        toast.success(nextAvailable ? t('available') : t('soldOut'));
      } catch (err) {
        setAvailable(previous);
        toast.error(toUserMessage(err, locale));
      }
    });
  }

  return (
    <div className="relative" {...longPressHandlers}>
      {isMenuOpen && (
        <div className="absolute right-2 top-2 z-20 rounded-md bg-[var(--brand-card)] p-1 shadow-lg ring-1 ring-ink-900/10">
          <button
            type="button"
            aria-label={`Marcar como ${actionLabel}`}
            disabled={isPending}
            onClick={handleToggleStock}
            className={cn(
              'flex h-12 min-w-12 items-center gap-2 rounded px-3 text-sm font-bold text-white transition-opacity disabled:opacity-60',
              nextAvailable ? 'bg-menta-500' : 'bg-red-500',
            )}
          >
            <ActionIcon aria-hidden="true" className="h-4 w-4" />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
      <div className={cn(isMenuOpen && 'opacity-80')}>{children}</div>
    </div>
  );
}

function actionErrorToApiError(code: string) {
  return code === 'rate_limited'
    ? new ApiError(429, code, 'Rate limited')
    : new ApiError(401, code, 'Unauthorized');
}
