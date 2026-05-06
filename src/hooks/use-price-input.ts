'use client';

import { useState } from 'react';

const PRICE_INPUT_PATTERN = /^\d+(\.\d{0,2})?$/;

export function getInitialPriceDisplay(initialCents: number) {
  return initialCents > 0 ? (initialCents / 100).toString() : '';
}

export function parsePriceInput(raw: string) {
  if (raw === '') {
    return { accepted: true as const, displayValue: '', cents: 0 };
  }

  if (!PRICE_INPUT_PATTERN.test(raw)) {
    return { accepted: false as const };
  }

  const cents = Math.round(Number(raw) * 100);
  if (Number.isNaN(cents)) {
    return { accepted: false as const };
  }

  return { accepted: true as const, displayValue: raw, cents };
}

export function usePriceInput(initialCents: number, onChange: (cents: number) => void) {
  const [displayValue, setDisplayValue] = useState(getInitialPriceDisplay(initialCents));

  function handleChange(raw: string) {
    const result = parsePriceInput(raw);
    if (!result.accepted) return;

    setDisplayValue(result.displayValue);
    onChange(result.cents);
  }

  return { displayValue, handleChange };
}
