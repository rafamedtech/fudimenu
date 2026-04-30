'use client';

import type { ReactNode } from 'react';
import { useCallback, useState, useTransition } from 'react';
import { CheckCircle2, CircleSlash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import { track } from '@/lib/analytics/events';
import { toUserMessage } from '@/lib/api/errors';
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
  const [available, setAvailable] = useState(initialAvailable);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openMenu = useCallback(() => setIsMenuOpen(true), []);
  const { longPressHandlers } = useLongPress({ onLongPress: openMenu });

  const nextAvailable = !available;
  const actionLabel = nextAvailable ? 'Disponible' : 'Agotado';
  const ActionIcon = nextAvailable ? CheckCircle2 : CircleSlash2;

  function handleToggleStock() {
    const previous = available;
    setAvailable(nextAvailable);
    setIsMenuOpen(false);
    track('stock_toggled', { itemId, available: nextAvailable });

    startTransition(async () => {
      try {
        await toggleItemAvailabilityAction(itemId, nextAvailable);
        toast.success(nextAvailable ? 'Disponible' : 'Marcado agotado');
      } catch (err) {
        setAvailable(previous);
        toast.error(toUserMessage(err));
      }
    });
  }

  return (
    <div className="relative" {...longPressHandlers}>
      {isMenuOpen && (
        <div className="absolute right-2 top-2 z-20 rounded-md bg-white p-1 shadow-lg ring-1 ring-ink-900/10">
          <button
            type="button"
            aria-label={`Marcar como ${actionLabel}`}
            disabled={isPending}
            onClick={handleToggleStock}
            className={cn(
              'flex h-11 items-center gap-2 rounded px-3 text-sm font-bold text-white transition-opacity disabled:opacity-60',
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
