/**
 * Weekly + dated visibility scheduling for menu content (items, categories,
 * sections).
 *
 * This is *publishing* visibility only — "show this on the public menu Mon–Fri
 * 07:00–11:00, only between Dec 1 and Dec 31". It is NOT inventory, ordering,
 * kitchen, or stock availability (that stays on `isAvailable`). Off-schedule
 * content is simply absent from the public menu; nothing about sellability is
 * implied.
 *
 * Evaluated in a per-tenant timezone (falls back to DEFAULT_TIME_ZONE). The
 * three dimensions are independent and ANDed together:
 *   - days:  weekdays 0=Sun…6=Sat. Empty = every day.
 *   - time:  local minute-of-day window [start, end). Open bound = day edge.
 *   - dates: inclusive local calendar range. Open bound = unbounded.
 *
 * Cross-midnight time windows are intentionally unsupported (validator enforces
 * start < end) so a window always belongs to exactly one weekday.
 */

/** Safe default when a tenant has no timezone configured. */
export const DEFAULT_TIME_ZONE = 'America/Mexico_City';

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
  /** Weekdays the content is visible (0=Sun…6=Sat). Empty = every day. */
  scheduleDays: number[];
  /** Local minute-of-day the window opens, inclusive. null = from 00:00. */
  scheduleStartMinute: number | null;
  /** Local minute-of-day the window closes, exclusive. null = until 24:00. */
  scheduleEndMinute: number | null;
  /** First local date (YYYY-MM-DD) the content is visible, inclusive. null = no lower bound. */
  scheduleStartDate: string | null;
  /** Last local date (YYYY-MM-DD) the content is visible, inclusive. null = no upper bound. */
  scheduleEndDate: string | null;
};

/** Always-visible schedule (no constraints). Handy for seeds, mocks, tests. */
export const EMPTY_VISIBILITY_SCHEDULE: VisibilitySchedule = {
  scheduleDays: [],
  scheduleStartMinute: null,
  scheduleEndMinute: null,
  scheduleStartDate: null,
  scheduleEndDate: null,
};

export type LocalSchedulePoint = {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  /** Minutes since local midnight, 0–1439. */
  minuteOfDay: number;
  /** Local calendar date as YYYY-MM-DD. */
  isoDate: string;
};

export type ScheduleStatus = 'visible' | 'scheduled' | 'out_of_window';

/** Resolve `date` to its weekday, minute-of-day, and calendar date in `timeZone`. */
export function getLocalSchedulePoint(
  date: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
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

  // en-CA renders dates as YYYY-MM-DD, which sorts chronologically as a string.
  const isoDate = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return {
    weekday: WEEKDAY_INDEX[weekdayLabel] ?? 0,
    minuteOfDay: hour * 60 + minute,
    isoDate,
  };
}

/** True when the schedule constrains visibility at all (vs. always-on). */
export function hasSchedule(schedule: VisibilitySchedule): boolean {
  return (
    schedule.scheduleDays.length > 0 ||
    schedule.scheduleStartMinute != null ||
    schedule.scheduleEndMinute != null ||
    schedule.scheduleStartDate != null ||
    schedule.scheduleEndDate != null
  );
}

/** True when `point` falls inside the schedule's day, time, AND date window. */
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

  // String compare is chronological for YYYY-MM-DD. Range is inclusive both ends.
  const dateOk =
    (schedule.scheduleStartDate == null || point.isoDate >= schedule.scheduleStartDate) &&
    (schedule.scheduleEndDate == null || point.isoDate <= schedule.scheduleEndDate);

  return dayOk && timeOk && dateOk;
}

/** True when the content should appear on the public menu at `now`. */
export function isItemVisibleNow(
  schedule: VisibilitySchedule,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): boolean {
  return isScheduleVisibleAt(schedule, getLocalSchedulePoint(now, timeZone));
}

/**
 * Admin-facing status:
 *   - visible:       on the public menu right now (or has no schedule at all).
 *   - scheduled:     not yet started — a future start date hasn't arrived.
 *   - out_of_window: off-day, off-hours, or past its end date.
 */
export function getScheduleStatusAt(
  schedule: VisibilitySchedule,
  point: LocalSchedulePoint,
): ScheduleStatus {
  if (!hasSchedule(schedule)) return 'visible';
  if (isScheduleVisibleAt(schedule, point)) return 'visible';
  if (schedule.scheduleStartDate != null && point.isoDate < schedule.scheduleStartDate) {
    return 'scheduled';
  }
  return 'out_of_window';
}

/** Convenience wrapper resolving the point from `now` + `timeZone`. */
export function getScheduleStatus(
  schedule: VisibilitySchedule,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): ScheduleStatus {
  return getScheduleStatusAt(schedule, getLocalSchedulePoint(now, timeZone));
}
