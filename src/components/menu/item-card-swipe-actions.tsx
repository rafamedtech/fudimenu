'use client';

import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { useRef, useState, useTransition } from 'react';
import { CheckCircle2, CircleSlash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import { track } from '@/lib/analytics/events';
import { toUserMessage } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

interface ItemCardSwipeActionsProps {
  children: ReactNode;
  itemId: string;
  initialAvailable: boolean;
}

const SWIPE_THRESHOLD_PX = 36;

export function ItemCardSwipeActions({
  children,
  itemId,
  initialAvailable,
}: ItemCardSwipeActionsProps) {
  const [available, setAvailable] = useState(initialAvailable);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    didSwipe: false,
  });

  const nextAvailable = !available;
  const actionLabel = nextAvailable ? 'Disponible' : 'Agotado';
  const ActionIcon = nextAvailable ? CheckCircle2 : CircleSlash2;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    gestureRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      didSwipe: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

    if (!isHorizontalSwipe || Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    gesture.didSwipe = true;
    setIsOpen(deltaX < 0);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture.didSwipe) return;

    if ((event.target as HTMLElement).closest('button')) {
      gesture.didSwipe = false;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    gesture.didSwipe = false;
  }

  function handleToggleStock() {
    const previous = available;
    setAvailable(nextAvailable);
    setIsOpen(false);
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
    <div
      className="relative overflow-hidden rounded-lg touch-pan-y"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClickCapture={handleClickCapture}
    >
      <div
        className={cn(
          'absolute inset-y-0 right-0 flex w-28 items-stretch justify-end',
          nextAvailable ? 'bg-menta-500' : 'bg-red-500',
        )}
      >
        <button
          type="button"
          aria-label={`Marcar como ${actionLabel}`}
          disabled={isPending}
          onClick={handleToggleStock}
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-bold text-white transition-opacity disabled:opacity-60"
        >
          <ActionIcon aria-hidden="true" className="h-5 w-5" />
          <span>{actionLabel}</span>
        </button>
      </div>
      <div
        className={cn(
          'relative transition-transform duration-200 ease-out',
          isOpen && '-translate-x-28',
        )}
      >
        {children}
      </div>
    </div>
  );
}
