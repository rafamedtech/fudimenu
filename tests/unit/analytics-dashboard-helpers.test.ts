import { describe, expect, it } from 'vitest';
import { deltaPercent, mapLabeledCounts } from '@/server/services/posthog-analytics.service';

describe('deltaPercent', () => {
  it('computes a rounded percentage change', () => {
    expect(deltaPercent(150, 100)).toBe(50);
    expect(deltaPercent(80, 100)).toBe(-20);
  });

  // No prior data must not read as "0% change" — the dashboard shows
  // "sin comparativo" for null, but "+100%" the first time data appears.
  it('returns null when there is no previous baseline and nothing now', () => {
    expect(deltaPercent(0, 0)).toBeNull();
  });

  it('returns 100 when something appears against an empty baseline', () => {
    expect(deltaPercent(12, 0)).toBe(100);
  });
});

describe('mapLabeledCounts', () => {
  it('maps HogQL [label, count] rows and trims labels', () => {
    expect(mapLabeledCounts([[' tacos ', 4], ['sushi', '2']])).toEqual([
      { label: 'tacos', count: 4 },
      { label: 'sushi', count: 2 },
    ]);
  });

  // Empty labels or zero counts are noise (e.g. blank search property) — drop them
  // so "no-result searches" and traffic-source lists stay actionable.
  it('drops empty labels and zero counts', () => {
    expect(mapLabeledCounts([['', 5], ['x', 0], [null as unknown as string, 3]])).toEqual([]);
  });

  it('tolerates a null result set', () => {
    expect(mapLabeledCounts(null)).toEqual([]);
  });
});
