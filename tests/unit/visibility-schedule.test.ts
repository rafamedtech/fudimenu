import { describe, expect, it } from 'vitest';
import {
  EMPTY_VISIBILITY_SCHEDULE,
  getLocalSchedulePoint,
  getScheduleStatus,
  hasSchedule,
  isItemVisibleNow,
  isScheduleVisibleAt,
  MINUTES_IN_DAY,
  type LocalSchedulePoint,
  type VisibilitySchedule,
} from '../../src/lib/visibility-schedule';

const TIJUANA = 'America/Tijuana';
const MEXICO_CITY = 'America/Mexico_City';

// 2024-01-15 is a Monday, 2024-01-13 a Saturday, 2024-01-14 a Sunday.

function schedule(overrides: Partial<VisibilitySchedule> = {}): VisibilitySchedule {
  return { ...EMPTY_VISIBILITY_SCHEDULE, ...overrides };
}

function point(overrides: Partial<LocalSchedulePoint> = {}): LocalSchedulePoint {
  return { weekday: 1, minuteOfDay: 600, isoDate: '2024-01-15', ...overrides };
}

describe('getLocalSchedulePoint', () => {
  it('resolves weekday, minute-of-day, and date in winter (UTC-8)', () => {
    // 16:00 UTC → 08:00 Tijuana PST, Monday.
    expect(getLocalSchedulePoint(new Date('2024-01-15T16:00:00Z'), TIJUANA)).toEqual({
      weekday: 1,
      minuteOfDay: 8 * 60,
      isoDate: '2024-01-15',
    });
  });

  it('resolves the same local wall-clock across DST (summer UTC-7)', () => {
    // 2024-07-15 Monday. 15:00 UTC → 08:00 Tijuana PDT.
    expect(getLocalSchedulePoint(new Date('2024-07-15T15:00:00Z'), TIJUANA)).toEqual({
      weekday: 1,
      minuteOfDay: 8 * 60,
      isoDate: '2024-07-15',
    });
  });

  it('rolls weekday AND date back when local time is the previous day', () => {
    // 07:30 UTC → 2024-01-14 23:30 Tijuana (Sunday).
    expect(getLocalSchedulePoint(new Date('2024-01-15T07:30:00Z'), TIJUANA)).toEqual({
      weekday: 0,
      minuteOfDay: 23 * 60 + 30,
      isoDate: '2024-01-14',
    });
  });

  it('places the same instant on different local dates per timezone', () => {
    // 2024-01-15 03:00 UTC: Tijuana is still 2024-01-14 19:00; CDMX is 2024-01-14 21:00.
    const utc = new Date('2024-01-15T03:00:00Z');
    expect(getLocalSchedulePoint(utc, TIJUANA).isoDate).toBe('2024-01-14');
    expect(getLocalSchedulePoint(utc, MEXICO_CITY).isoDate).toBe('2024-01-14');
    // 2024-01-15 07:00 UTC: Tijuana 2024-01-14 23:00, CDMX 2024-01-15 01:00 — dates diverge.
    const utc2 = new Date('2024-01-15T07:00:00Z');
    expect(getLocalSchedulePoint(utc2, TIJUANA).isoDate).toBe('2024-01-14');
    expect(getLocalSchedulePoint(utc2, MEXICO_CITY).isoDate).toBe('2024-01-15');
  });

  it('normalizes local midnight to minute 0 (not 1440)', () => {
    // 08:00 UTC → 00:00 Tijuana PST.
    expect(getLocalSchedulePoint(new Date('2024-01-15T08:00:00Z'), TIJUANA).minuteOfDay).toBe(0);
  });
});

describe('hasSchedule', () => {
  it('is false only when no dimension is constrained', () => {
    expect(hasSchedule(EMPTY_VISIBILITY_SCHEDULE)).toBe(false);
    expect(hasSchedule(schedule({ scheduleDays: [1] }))).toBe(true);
    expect(hasSchedule(schedule({ scheduleStartMinute: 0 }))).toBe(true);
    expect(hasSchedule(schedule({ scheduleStartDate: '2024-01-01' }))).toBe(true);
  });
});

describe('isScheduleVisibleAt', () => {
  it('is always visible with no constraints', () => {
    expect(isScheduleVisibleAt(EMPTY_VISIBILITY_SCHEDULE, point())).toBe(true);
  });

  it('restricts to listed weekdays', () => {
    const s = schedule({ scheduleDays: [1, 2, 3, 4, 5] });
    expect(isScheduleVisibleAt(s, point({ weekday: 1 }))).toBe(true);
    expect(isScheduleVisibleAt(s, point({ weekday: 6 }))).toBe(false);
  });

  it('treats start inclusive, end exclusive', () => {
    const s = schedule({ scheduleStartMinute: 420, scheduleEndMinute: 660 });
    expect(isScheduleVisibleAt(s, point({ minuteOfDay: 420 }))).toBe(true);
    expect(isScheduleVisibleAt(s, point({ minuteOfDay: 659 }))).toBe(true);
    expect(isScheduleVisibleAt(s, point({ minuteOfDay: 660 }))).toBe(false);
    expect(isScheduleVisibleAt(s, point({ minuteOfDay: 419 }))).toBe(false);
  });

  it('opens an unset time bound to the edge of the day', () => {
    const fromSeven = schedule({ scheduleStartMinute: 420 });
    expect(isScheduleVisibleAt(fromSeven, point({ minuteOfDay: MINUTES_IN_DAY - 1 }))).toBe(true);
    expect(isScheduleVisibleAt(fromSeven, point({ minuteOfDay: 419 }))).toBe(false);

    const untilNoon = schedule({ scheduleEndMinute: 720 });
    expect(isScheduleVisibleAt(untilNoon, point({ minuteOfDay: 0 }))).toBe(true);
    expect(isScheduleVisibleAt(untilNoon, point({ minuteOfDay: 720 }))).toBe(false);
  });

  describe('date range (inclusive both ends)', () => {
    const s = schedule({ scheduleStartDate: '2024-12-01', scheduleEndDate: '2024-12-31' });

    it('includes the boundary dates', () => {
      expect(isScheduleVisibleAt(s, point({ isoDate: '2024-12-01' }))).toBe(true);
      expect(isScheduleVisibleAt(s, point({ isoDate: '2024-12-31' }))).toBe(true);
    });

    it('excludes dates before start and after end', () => {
      expect(isScheduleVisibleAt(s, point({ isoDate: '2024-11-30' }))).toBe(false);
      expect(isScheduleVisibleAt(s, point({ isoDate: '2025-01-01' }))).toBe(false);
    });

    it('treats an open bound as unbounded', () => {
      const fromDec = schedule({ scheduleStartDate: '2024-12-01' });
      expect(isScheduleVisibleAt(fromDec, point({ isoDate: '2030-06-01' }))).toBe(true);
      expect(isScheduleVisibleAt(fromDec, point({ isoDate: '2024-11-30' }))).toBe(false);

      const untilDec = schedule({ scheduleEndDate: '2024-12-31' });
      expect(isScheduleVisibleAt(untilDec, point({ isoDate: '1999-01-01' }))).toBe(true);
      expect(isScheduleVisibleAt(untilDec, point({ isoDate: '2025-01-01' }))).toBe(false);
    });
  });

  it('ANDs day, time, AND date together', () => {
    const xmasBreakfast = schedule({
      scheduleDays: [1, 2, 3, 4, 5],
      scheduleStartMinute: 420,
      scheduleEndMinute: 660,
      scheduleStartDate: '2024-12-01',
      scheduleEndDate: '2024-12-31',
    });
    const inWindow = point({ weekday: 1, minuteOfDay: 500, isoDate: '2024-12-02' });
    expect(isScheduleVisibleAt(xmasBreakfast, inWindow)).toBe(true);
    // Right day + time, wrong date.
    expect(isScheduleVisibleAt(xmasBreakfast, { ...inWindow, isoDate: '2024-11-15' })).toBe(false);
    // Right date + time, wrong day.
    expect(isScheduleVisibleAt(xmasBreakfast, { ...inWindow, weekday: 0 })).toBe(false);
    // Right date + day, wrong time.
    expect(isScheduleVisibleAt(xmasBreakfast, { ...inWindow, minuteOfDay: 700 })).toBe(false);
  });
});

describe('isItemVisibleNow (timezone-aware)', () => {
  const breakfast = schedule({
    scheduleDays: [1, 2, 3, 4, 5],
    scheduleStartMinute: 420,
    scheduleEndMinute: 660,
  });

  it('uses the supplied timezone — same instant, different verdict', () => {
    // 2024-01-15 18:30 UTC. Tijuana = 10:30 (in window). CDMX = 12:30 (out).
    const instant = new Date('2024-01-15T18:30:00Z');
    expect(isItemVisibleNow(breakfast, instant, TIJUANA)).toBe(true);
    expect(isItemVisibleNow(breakfast, instant, MEXICO_CITY)).toBe(false);
  });

  it('defaults to America/Mexico_City when no zone is given', () => {
    // 14:00 UTC → CDMX 08:00 (in window), Tijuana would be 06:00 (out).
    expect(isItemVisibleNow(breakfast, new Date('2024-01-15T14:00:00Z'))).toBe(true);
  });
});

describe('getScheduleStatus', () => {
  const now = new Date('2024-01-15T14:00:00Z'); // CDMX Mon 08:00

  it('reports visible when unconstrained', () => {
    expect(getScheduleStatus(EMPTY_VISIBILITY_SCHEDULE, now, MEXICO_CITY)).toBe('visible');
  });

  it('reports visible when inside the window', () => {
    const s = schedule({ scheduleStartMinute: 420, scheduleEndMinute: 660 });
    expect(getScheduleStatus(s, now, MEXICO_CITY)).toBe('visible');
  });

  it('reports scheduled when the start date is still in the future', () => {
    const s = schedule({ scheduleStartDate: '2024-02-01', scheduleEndDate: '2024-02-28' });
    expect(getScheduleStatus(s, now, MEXICO_CITY)).toBe('scheduled');
  });

  it('reports out_of_window off-hours (recurring schedule, currently closed)', () => {
    const s = schedule({ scheduleStartMinute: 1200, scheduleEndMinute: 1320 }); // 20:00–22:00
    expect(getScheduleStatus(s, now, MEXICO_CITY)).toBe('out_of_window');
  });

  it('reports out_of_window once the end date has passed (expired)', () => {
    const s = schedule({ scheduleStartDate: '2023-12-01', scheduleEndDate: '2023-12-31' });
    expect(getScheduleStatus(s, now, MEXICO_CITY)).toBe('out_of_window');
  });
});
