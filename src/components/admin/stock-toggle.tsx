'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useReducer, useTransition } from 'react';
import { toast } from 'sonner';
import { Toggle } from '@/components/ui/toggle';
import { toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import { track } from '@/lib/analytics/events';
import { ApiError, toUserMessage } from '@/lib/api/errors';
import { refreshMenuPreview } from '@/lib/menu-preview';

interface StockToggleProps {
  itemId: string;
  initial: boolean;
}

export function StockToggle({ itemId, initial }: StockToggleProps) {
  const locale = useLocale();
  const t = useTranslations('menu');
  const [available, setAvailable] = useReducer((_: boolean, next: boolean) => next, initial);
  const [isPending, startTransition] = useTransition();

  function toggleAvailability(next: boolean) {
    const previous = available;
    setAvailable(next);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(10);
    track('stock_toggled', { itemId, available: next });
    startTransition(async () => {
      try {
        const res = await toggleItemAvailabilityAction(itemId, next);
        if (!res.ok) {
          setAvailable(previous);
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        refreshMenuPreview();
        toast.success(next ? t('available') : t('soldOut'));
      } catch (err) {
        setAvailable(previous);
        toast.error(toUserMessage(err, locale));
      }
    });
  }

  return <Toggle checked={available} onChange={toggleAvailability} disabled={isPending} ariaLabel={t('available')} />;
}

function actionErrorToApiError(code: string) {
  return code === 'rate_limited'
    ? new ApiError(429, code, 'Rate limited')
    : new ApiError(401, code, 'Unauthorized');
}
