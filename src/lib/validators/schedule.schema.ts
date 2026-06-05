import { z } from 'zod';

/**
 * Shared visibility-scheduling fields for items, categories, and sections.
 * Spread `scheduleShape` into an entity's z.object and call `refineSchedule`
 * from its `.superRefine` so all three entities validate identically.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const scheduleShape = {
  // Weekdays 0=Sun…6=Sat; deduped + sorted so the DB holds a canonical set.
  scheduleDays: z
    .array(z.number().int().min(0).max(6))
    .max(7)
    .transform((days) => [...new Set(days)].sort((a, b) => a - b))
    .optional(),
  // Local minute-of-day, 0–1439 (start) / 1–1440 (exclusive end).
  scheduleStartMinute: z.number().int().min(0).max(1439).nullable().optional(),
  scheduleEndMinute: z.number().int().min(1).max(1440).nullable().optional(),
  // Inclusive local calendar dates, YYYY-MM-DD.
  scheduleStartDate: z.string().regex(ISO_DATE, 'Fecha inválida').nullable().optional(),
  scheduleEndDate: z.string().regex(ISO_DATE, 'Fecha inválida').nullable().optional(),
};

/** True when `tz` is an IANA zone the runtime's Intl accepts. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type ScheduleData = {
  scheduleStartMinute?: number | null;
  scheduleEndMinute?: number | null;
  scheduleStartDate?: string | null;
  scheduleEndDate?: string | null;
};

export function refineSchedule(data: ScheduleData, ctx: z.RefinementCtx): void {
  // Each time bound is independent (open start = from 00:00, open end = until
  // 24:00). When both are set the window must not cross midnight.
  if (
    data.scheduleStartMinute != null &&
    data.scheduleEndMinute != null &&
    data.scheduleStartMinute >= data.scheduleEndMinute
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La hora de fin debe ser mayor a la de inicio',
      path: ['scheduleEndMinute'],
    });
  }

  // Date range is inclusive both ends; end may equal start (single day).
  if (
    data.scheduleStartDate != null &&
    data.scheduleEndDate != null &&
    data.scheduleStartDate > data.scheduleEndDate
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La fecha de fin no puede ser anterior a la de inicio',
      path: ['scheduleEndDate'],
    });
  }
}
