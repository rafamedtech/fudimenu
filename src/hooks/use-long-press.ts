'use client';

import type { MouseEvent, TouchEvent } from 'react';
import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
  moveTolerance?: number;
  hapticMs?: number;
}

const DEFAULT_DELAY_MS = 500;
const DEFAULT_MOVE_TOLERANCE_PX = 12;
const DEFAULT_HAPTIC_MS = 10;

export function useLongPress({
  onLongPress,
  delay = DEFAULT_DELAY_MS,
  moveTolerance = DEFAULT_MOVE_TOLERANCE_PX,
  hapticMs = DEFAULT_HAPTIC_MS,
}: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    didLongPress: false,
  });

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const start = useCallback(
    (clientX: number, clientY: number) => {
      clearTimer();
      gestureRef.current = {
        startX: clientX,
        startY: clientY,
        didLongPress: false,
      };
      timerRef.current = setTimeout(() => {
        gestureRef.current.didLongPress = true;
        if ('vibrate' in navigator) navigator.vibrate(hapticMs);
        onLongPress();
      }, delay);
    },
    [clearTimer, delay, hapticMs, onLongPress],
  );

  const cancelIfMoved = useCallback(
    (clientX: number, clientY: number) => {
      const gesture = gestureRef.current;
      const deltaX = Math.abs(clientX - gesture.startX);
      const deltaY = Math.abs(clientY - gesture.startY);

      if (deltaX > moveTolerance || deltaY > moveTolerance) clearTimer();
    },
    [clearTimer, moveTolerance],
  );

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    start(touch.clientX, touch.clientY);
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    if (!touch) return;

    cancelIfMoved(touch.clientX, touch.clientY);
  }

  function handleMouseDown(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0) return;

    start(event.clientX, event.clientY);
  }

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    cancelIfMoved(event.clientX, event.clientY);
  }

  function handleContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    clearTimer();
    gestureRef.current.didLongPress = true;
    onLongPress();
  }

  function handleClickCapture(event: MouseEvent<HTMLElement>) {
    if (!gestureRef.current.didLongPress) return;

    if ((event.target as HTMLElement).closest('button')) {
      gestureRef.current.didLongPress = false;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    gestureRef.current.didLongPress = false;
  }

  return {
    longPressHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: clearTimer,
      onTouchCancel: clearTimer,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: clearTimer,
      onMouseLeave: clearTimer,
      onContextMenu: handleContextMenu,
      onClickCapture: handleClickCapture,
    },
  };
}
