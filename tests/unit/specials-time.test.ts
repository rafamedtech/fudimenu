import { describe, expect, it } from 'vitest';
import {
  getLocalDateParts,
  getTimeZoneOffsetMs,
  getTodayNudgeWindow,
  isBeforeNudgeCutoff,
  localTimeToUtc,
  SPECIALS_TIME_ZONE,
} from '../../src/lib/specials-time';

// Tijuana uses America/Tijuana (UTC-8 PST winter, UTC-7 PDT summer)

describe('getLocalDateParts', () => {
  it('returns correct date for Tijuana (winter UTC-8)', () => {
    // 2024-01-15 08:30 UTC = 2024-01-15 00:30 Tijuana
    const date = new Date('2024-01-15T08:30:00Z');
    const parts = getLocalDateParts(date, SPECIALS_TIME_ZONE);
    expect(parts).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('crosses date boundary correctly (previous UTC day = same local day)', () => {
    // 2024-01-15 07:59 UTC = 2024-01-14 23:59 Tijuana
    const date = new Date('2024-01-15T07:59:00Z');
    const parts = getLocalDateParts(date, SPECIALS_TIME_ZONE);
    expect(parts).toEqual({ year: 2024, month: 1, day: 14 });
  });

  it('returns correct date for Tijuana (summer UTC-7)', () => {
    // 2024-07-15 07:30 UTC = 2024-07-15 00:30 Tijuana PDT
    const date = new Date('2024-07-15T07:30:00Z');
    const parts = getLocalDateParts(date, SPECIALS_TIME_ZONE);
    expect(parts).toEqual({ year: 2024, month: 7, day: 15 });
  });
});

describe('getTimeZoneOffsetMs', () => {
  it('returns -8h for Tijuana in winter (PST)', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const offsetMs = getTimeZoneOffsetMs(date, SPECIALS_TIME_ZONE);
    expect(offsetMs).toBe(-8 * 60 * 60 * 1000);
  });

  it('returns -7h for Tijuana in summer (PDT)', () => {
    const date = new Date('2024-07-15T12:00:00Z');
    const offsetMs = getTimeZoneOffsetMs(date, SPECIALS_TIME_ZONE);
    expect(offsetMs).toBe(-7 * 60 * 60 * 1000);
  });
});

describe('localTimeToUtc', () => {
  it('converts local midnight to UTC (winter)', () => {
    const utc = localTimeToUtc({ year: 2024, month: 1, day: 15 }, 0, 0, SPECIALS_TIME_ZONE);
    expect(utc.toISOString()).toBe('2024-01-15T08:00:00.000Z');
  });

  it('converts local 10am to UTC (winter)', () => {
    const utc = localTimeToUtc({ year: 2024, month: 1, day: 15 }, 10, 0, SPECIALS_TIME_ZONE);
    expect(utc.toISOString()).toBe('2024-01-15T18:00:00.000Z');
  });

  it('converts local midnight to UTC (summer)', () => {
    const utc = localTimeToUtc({ year: 2024, month: 7, day: 15 }, 0, 0, SPECIALS_TIME_ZONE);
    expect(utc.toISOString()).toBe('2024-07-15T07:00:00.000Z');
  });

  it('converts local 10am to UTC (summer)', () => {
    const utc = localTimeToUtc({ year: 2024, month: 7, day: 15 }, 10, 0, SPECIALS_TIME_ZONE);
    expect(utc.toISOString()).toBe('2024-07-15T17:00:00.000Z');
  });
});

describe('getTodayNudgeWindow', () => {
  it('window spans local midnight to 10am (winter)', () => {
    // noon UTC = 04:00 Tijuana, local date is Jan 15
    const now = new Date('2024-01-15T12:00:00Z');
    const { startOfDay, tenAm } = getTodayNudgeWindow(now);
    expect(startOfDay.toISOString()).toBe('2024-01-15T08:00:00.000Z');
    expect(tenAm.toISOString()).toBe('2024-01-15T18:00:00.000Z');
  });

  it('window spans local midnight to 10am (summer)', () => {
    // noon UTC = 05:00 Tijuana PDT, local date is Jul 15
    const now = new Date('2024-07-15T12:00:00Z');
    const { startOfDay, tenAm } = getTodayNudgeWindow(now);
    expect(startOfDay.toISOString()).toBe('2024-07-15T07:00:00.000Z');
    expect(tenAm.toISOString()).toBe('2024-07-15T17:00:00.000Z');
  });

  it('startOfDay is always before tenAm', () => {
    const cases = [
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-03-10T10:00:00Z'), // DST transition day
      new Date('2024-11-03T10:00:00Z'), // DST end day
      new Date('2024-12-31T23:59:00Z'),
    ];
    for (const now of cases) {
      const { startOfDay, tenAm } = getTodayNudgeWindow(now);
      expect(startOfDay < tenAm).toBe(true);
    }
  });

  it('window is exactly 10 hours wide', () => {
    const now = new Date('2024-06-01T15:00:00Z');
    const { startOfDay, tenAm } = getTodayNudgeWindow(now);
    const diffHours = (tenAm.getTime() - startOfDay.getTime()) / (60 * 60 * 1000);
    expect(diffHours).toBe(10);
  });
});

describe('isBeforeNudgeCutoff', () => {
  it('returns true at local midnight (00:00 Tijuana)', () => {
    // Jan 15 08:00 UTC = 00:00 Tijuana
    expect(isBeforeNudgeCutoff(new Date('2024-01-15T08:00:00Z'))).toBe(true);
  });

  it('returns true just before 10am (09:59 Tijuana)', () => {
    // Jan 15 17:59 UTC = 09:59 Tijuana
    expect(isBeforeNudgeCutoff(new Date('2024-01-15T17:59:00Z'))).toBe(true);
  });

  it('returns false at exactly 10am (10:00 Tijuana)', () => {
    // Jan 15 18:00 UTC = 10:00 Tijuana
    expect(isBeforeNudgeCutoff(new Date('2024-01-15T18:00:00Z'))).toBe(false);
  });

  it('returns false after 10am (12:00 Tijuana)', () => {
    // Jan 15 20:00 UTC = 12:00 Tijuana
    expect(isBeforeNudgeCutoff(new Date('2024-01-15T20:00:00Z'))).toBe(false);
  });

  it('returns false before local midnight (23:59 previous day Tijuana)', () => {
    // Jan 15 07:59 UTC = 23:59 Jan 14 Tijuana — before today's startOfDay
    expect(isBeforeNudgeCutoff(new Date('2024-01-15T07:59:00Z'))).toBe(false);
  });
});
