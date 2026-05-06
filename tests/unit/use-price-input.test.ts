import { describe, expect, it } from 'vitest';
import { getInitialPriceDisplay, parsePriceInput } from '@/hooks/use-price-input';

describe('usePriceInput', () => {
  it('accepts empty input as zero cents', () => {
    expect(parsePriceInput('')).toEqual({
      accepted: true,
      displayValue: '',
      cents: 0,
    });
  });

  it('accepts one decimal place', () => {
    expect(parsePriceInput('1.5')).toEqual({
      accepted: true,
      displayValue: '1.5',
      cents: 150,
    });
  });

  it('accepts two decimal places and preserves display text', () => {
    expect(parsePriceInput('1.50')).toEqual({
      accepted: true,
      displayValue: '1.50',
      cents: 150,
    });
  });

  it('ignores non-numeric text', () => {
    expect(parsePriceInput('abc')).toEqual({ accepted: false });
  });

  it('ignores values with more than two decimals', () => {
    expect(parsePriceInput('1.999')).toEqual({ accepted: false });
  });

  it('formats initial cents for display', () => {
    expect(getInitialPriceDisplay(12000)).toBe('120');
  });
});
