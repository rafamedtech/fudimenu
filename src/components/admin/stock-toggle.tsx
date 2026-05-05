'use client';
import { useLocale } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Toggle } from '@/components/ui/toggle';
import { toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import { track } from '@/lib/analytics/events';
import { ApiError, toUserMessage } from '@/lib/api/errors';

interface StockToggleProps {
  itemId: string;
  initial: boolean;
}

export function StockToggle({ itemId, initial }: StockToggleProps) {
  const locale = useLocale();
  const [available, setAvailable] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    const previous = available;
    setAvailable(next);
    track('stock_toggled', { itemId, available: next });
    startTransition(async () => {
      try {
        const res = await toggleItemAvailabilityAction(itemId, next);
        if (!res.ok) {
          setAvailable(previous);
          toast.error(toUserMessage(actionErrorToApiError(res.code), locale));
          return;
        }

        toast.success(next ? 'Disponible' : 'Marcado agotado');
      } catch (err) {
        setAvailable(previous);
        toast.error(toUserMessage(err, locale));
      }
    });
  }

  return <Toggle checked={available} onChange={handleChange} disabled={isPending} ariaLabel="Disponible" />;
}

function actionErrorToApiError(code: 'unauthorized') {
  return new ApiError(401, code, 'Unauthorized');
}
