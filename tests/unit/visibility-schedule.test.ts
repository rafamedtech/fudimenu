import { describe, expect, it } from 'vitest';
import {
  getLocalSchedulePoint,
  isItemVisibleNow,
  isScheduleVisibleAt,
  MINUTES_IN_DAY,
  type VisibilitySchedule,
} from '../../src/lib/visibility-schedule';
import { SPECIALS_TIME_ZONE } from '../../src/lib/specials-time';

// Tijuana: PST (UTC-8) in winter, PDT (UTC-7) in summer.
// Anchor dates: 2024-01-15 is a Monday, 2024-01-13 a Saturday, 2024-01-14 a Sunday.

describe('getLocalSchedulePoint', () => {
  it('resolves weekday + minute-of-day in winter (UTC-8)', () => {
    // 16:00 UTC → 08:00 Tijuana PST, Monday.
    const point = getLocalSchedulePoint(new Date('2024-01-15T16:00:00Z'), SPECIALS_TIME_ZONE);
    expect(point).toEqual({ weekday: 1, minuteOfDay: 8 * 60 });
  });

  it('resolves the same local wall-clock across DST (summer UTC-7)', () => {
    // 2024-07-15 is also a Monday. 15:00 UTC → 08:00 Tijuana PDT.
    const point = getLocalSchedulePoint(new Date('2024-07-15T15:00:00Z'), SPECIALS_TIME_ZONE);
    expect(point).toEqual({ weekday: 1, minuteOfDay: 8 * 60 });
  });

  it('rolls the weekday back when local time is the previous day', () => {
    // 07:30 UTC → 2024-01-14 23:30 Tijuana, which is Sunday.
    const point = getLocalSchedulePoint(new Date('2024-01-15T07:30:00Z'), SPECIALS_TIME_ZONE);
    expect(point).toEqual({ weekday: 0, minuteOfDay: 23 * 60 + 30 });
  });

  it('normalizes local midnight to minute 0 (not 1440)', () => {
    // 08:00 UTC → 00:00 Tijuana PST.
    const point = getLocalSchedulePoint(new Date('2024-01-15T08:00:00Z'), SPECIALS_TIME_ZONE);
    expect(point).toEqual({ weekday: 1, minuteOfDay: 0 });
  });
});

describe('isScheduleVisibleAt', () => {
  const allDay: VisibilitySchedule = {
    scheduleDays: [],
    scheduleStartMinute: null,
    scheduleEndMinute: null,
  };

  it('is always visible with no days and no time window', () => {
    expect(isScheduleVisibleAt(allDay, { weekday: 3, minuteOfDay: 0 })).toBe(true);
    expect(isScheduleVisibleAt(allDay, { weekday: 6, minuteOfDay: MINUTES_IN_DAY - 1 })).toBe(true);
  });

  it('restricts to listed weekdays when days are set', () => {
    const weekdays: VisibilitySchedule = { ...allDay, scheduleDays: [1, 2, 3, 4, 5] };
    expect(isScheduleVisibleAt(weekdays, { weekday: 1, minuteOfDay: 600 })).toBe(true);
    // Saturday (6) not listed → hidden, even though the time is unconstrained.
    expect(isScheduleVisibleAt(weekdays, { weekday: 6, minuteOfDay: 600 })).toBe(false);
  });

  it('treats the start bound as inclusive and the end bound as exclusive', () => {
    const window: VisibilitySchedule = {
      scheduleDays: [],
      scheduleStartMinute: 420, // 07:00
      scheduleEndMinute: 660, // 11:00
    };
    expect(isScheduleVisibleAt(window, { weekday: 1, minuteOfDay: 420 })).toBe(true); // open edge
    expect(isScheduleVisibleAt(window, { weekday: 1, minuteOfDay: 659 })).toBe(true);
    expect(isScheduleVisibleAt(window, { weekday: 1, minuteOfDay: 660 })).toBe(false); // close edge
    expect(isScheduleVisibleAt(window, { weekday: 1, minuteOfDay: 419 })).toBe(false);
  });

  it('opens an unset bound to the edge of the day', () => {
    const fromSeven: VisibilitySchedule = {
      scheduleDays: [],
      scheduleStartMinute: 420,
      scheduleEndMinute: null, // until end of day
    };
    expect(isScheduleVisibleAt(fromSeven, { weekday: 1, minuteOfDay: MINUTES_IN_DAY - 1 })).toBe(true);
    expect(isScheduleVisibleAt(fromSeven, { weekday: 1, minuteOfDay: 419 })).toBe(false);

    const untilNoon: VisibilitySchedule = {
      scheduleDays: [],
      scheduleStartMinute: null, // from midnight
      scheduleEndMinute: 720,
    };
    expect(isScheduleVisibleAt(untilNoon, { weekday: 1, minuteOfDay: 0 })).toBe(true);
    expect(isScheduleVisibleAt(untilNoon, { weekday: 1, minuteOfDay: 720 })).toBe(false);
  });

  it('requires both the day AND the time window to match', () => {
    const breakfast: VisibilitySchedule = {
      scheduleDays: [1],
      scheduleStartMinute: 420,
      scheduleEndMinute: 660,
    };
    // Right time, wrong day.
    expect(isScheduleVisibleAt(breakfast, { weekday: 2, minuteOfDay: 500 })).toBe(false);
    // Right day, wrong time.
    expect(isScheduleVisibleAt(breakfast, { weekday: 1, minuteOfDay: 700 })).toBe(false);
    // Both match.
    expect(isScheduleVisibleAt(breakfast, { weekday: 1, minuteOfDay: 500 })).toBe(true);
  });
});

describe('isItemVisibleNow', () => {
  // Mon–Fri breakfast, 07:00–11:00 Tijuana — the canonical use case.
  const breakfast: VisibilitySchedule = {
    scheduleDays: [1, 2, 3, 4, 5],
    scheduleStartMinute: 420,
    scheduleEndMinute: 660,
  };

  it('shows the item inside the window on a listed weekday', () => {
    // 16:00 UTC → Mon 08:00 Tijuana.
    expect(isItemVisibleNow(breakfast, new Date('2024-01-15T16:00:00Z'))).toBe(true);
  });

  it('hides the item exactly at the exclusive close time', () => {
    // 19:00 UTC → Mon 11:00 Tijuana = minute 660.
    expect(isItemVisibleNow(breakfast, new Date('2024-01-15T19:00:00Z'))).toBe(false);
  });

  it('hides the item before the window opens', () => {
    // 14:30 UTC → Mon 06:30 Tijuana.
    expect(isItemVisibleNow(breakfast, new Date('2024-01-15T14:30:00Z'))).toBe(false);
  });

  it('hides the item on an unlisted weekday', () => {
    // 16:00 UTC → Sat 08:00 Tijuana (2024-01-13).
    expect(isItemVisibleNow(breakfast, new Date('2024-01-13T16:00:00Z'))).toBe(false);
  });

  it('keeps the same window after the spring DST shift', () => {
    // 2024-07-15 Mon, 15:00 UTC → 08:00 Tijuana PDT — still inside 07:00–11:00.
    expect(isItemVisibleNow(breakfast, new Date('2024-07-15T15:00:00Z'))).toBe(true);
  });
});
