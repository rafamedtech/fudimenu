import { SPECIALS_TIME_ZONE } from './specials-time';

/**
 * Weekly visibility scheduling for menu items.
 *
 * This is *publishing* visibility only — "show this item on the public menu
 * Mon–Fri, 7:00–11:00". It is NOT inventory, ordering, or operational
 * availability (that stays on `isAvailable`). An off-schedule item is simply
 * absent from the public menu; nothing about stock or sellability is implied.
 *
 * Evaluated in a single fixed zone (SPECIALS_TIME_ZONE), matching the existing
 * specials logic — there is no per-tenant timezone yet.
 *
 * Cross-midnight windows are intentionally unsupported (validator enforces
 * start < end) so a window always belongs to exactly one weekday and the
 * day/time checks stay independent.
 */

export const MINUTES_IN_DAY = 1440;

/** 0 = Sunday … 6 = Saturday, matching `Date.getDay()` and Postgres `dow`. */
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type VisibilitySchedule = {
  /** Weekdays the item is visible (0=Sun…6=Sat). Empty = every day. */
  scheduleDays: number[];
  /** Local minute-of-day the window opens, inclusive. null = from 00:00. */
  scheduleStartMinute: number | null;
  /** Local minute-of-day the window closes, exclusive. null = until 24:00. */
  scheduleEndMinute: number | null;
};

export type LocalSchedulePoint = {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Minutes since local midnight, 0–1439. */
  minuteOfDay: number;
};

/** Resolve `date` to its weekday + minute-of-day in the given zone. */
export function getLocalSchedulePoint(
  date: Date,
  timeZone: string = SPECIALS_TIME_ZONE,
): LocalSchedulePoint {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekdayLabel = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  // hour12:false emits '24' for midnight in some runtimes; normalize to 0.
  let hour = Number(parts.find((p) => p.type === 'hour')?.value);
  if (hour === 24) hour = 0;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);

  return {
    weekday: WEEKDAY_INDEX[weekdayLabel] ?? 0,
    minuteOfDay: hour * 60 + minute,
  };
}

/** True when `point` falls inside the schedule's day + time window. */
export function isScheduleVisibleAt(
  schedule: VisibilitySchedule,
  point: LocalSchedulePoint,
): boolean {
  const dayOk =
    schedule.scheduleDays.length === 0 || schedule.scheduleDays.includes(point.weekday);

  // null bounds open the window to the day's edges, so "no time set" = all day.
  const start = schedule.scheduleStartMinute ?? 0;
  const end = schedule.scheduleEndMinute ?? MINUTES_IN_DAY;
  const timeOk = point.minuteOfDay >= start && point.minuteOfDay < end;

  return dayOk && timeOk;
}

/** True when the item should appear on the public menu at `now`. */
export function isItemVisibleNow(
  schedule: VisibilitySchedule,
  now: Date = new Date(),
  timeZone: string = SPECIALS_TIME_ZONE,
): boolean {
  return isScheduleVisibleAt(schedule, getLocalSchedulePoint(now, timeZone));
}
