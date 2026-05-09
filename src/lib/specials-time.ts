export const SPECIALS_TIME_ZONE = 'America/Tijuana';

type LocalDateParts = { year: number; month: number; day: number };

export function getLocalDateParts(date: Date, timeZone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === 'year')?.value),
    month: Number(parts.find((p) => p.type === 'month')?.value),
    day: Number(parts.find((p) => p.type === 'day')?.value),
  };
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const part = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;

  const match = part?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 60 + minutes) * 60 * 1000;
}

export function localTimeToUtc(
  { year, month, day }: LocalDateParts,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return new Date(utcGuess.getTime() - getTimeZoneOffsetMs(utcGuess, timeZone));
}

export function getTodayNudgeWindow(now = new Date()): {
  startOfDay: Date;
  tenAm: Date;
} {
  const localDate = getLocalDateParts(now, SPECIALS_TIME_ZONE);
  return {
    startOfDay: localTimeToUtc(localDate, 0, 0, SPECIALS_TIME_ZONE),
    tenAm: localTimeToUtc(localDate, 10, 0, SPECIALS_TIME_ZONE),
  };
}

export function isBeforeNudgeCutoff(now = new Date()): boolean {
  const { startOfDay, tenAm } = getTodayNudgeWindow(now);
  return now >= startOfDay && now < tenAm;
}
