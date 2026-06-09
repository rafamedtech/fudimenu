import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStoredTrafficSource,
  parseTrafficSource,
  rememberTrafficSource,
} from '@/lib/analytics/traffic-source';

describe('parseTrafficSource', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        clear: () => values.clear(),
      },
    });
  });

  // QR scans carry utm_source=qr (set in /api/qr/[slug]); attribution depends on it.
  it('reads the QR source from the scanned URL', () => {
    expect(parseTrafficSource('?utm_source=qr')).toEqual({ source: 'qr', utm_source: 'qr' });
  });

  it('reads source and campaign together', () => {
    expect(parseTrafficSource('?utm_source=qr&utm_campaign=mesa1')).toEqual({
      source: 'qr',
      campaign: 'mesa1',
      utm_source: 'qr',
      utm_campaign: 'mesa1',
    });
  });

  // Direct/link traffic has no utm — must yield an empty object, not noise keys,
  // so the dashboard can fold it into "direct".
  it('returns no keys when there is no utm', () => {
    expect(parseTrafficSource('')).toEqual({});
    expect(parseTrafficSource('?lang=en')).toEqual({});
  });

  // Anonymization guard: lowercase + length cap keep tokens low-cardinality.
  it('normalizes case and caps length', () => {
    const long = 'A'.repeat(80);
    const parsed = parseTrafficSource(`?utm_source=${long}&utm_campaign=PrintFlyer`);
    expect(parsed.source).toBe('a'.repeat(64));
    expect(parsed.campaign).toBe('printflyer');
    expect(parsed.utm_source).toBe('a'.repeat(64));
    expect(parsed.utm_campaign).toBe('printflyer');
  });

  it('drops blank utm values', () => {
    expect(parseTrafficSource('?utm_source=&utm_campaign=%20')).toEqual({});
  });

  it('stores attribution for later public-menu events in the same session', () => {
    expect(rememberTrafficSource('?utm_source=QR&utm_campaign=Table-7')).toEqual({
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });

    expect(getStoredTrafficSource()).toEqual({
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });
    expect(rememberTrafficSource('')).toEqual({
      source: 'qr',
      campaign: 'table-7',
      utm_source: 'qr',
      utm_campaign: 'table-7',
    });
  });
});
