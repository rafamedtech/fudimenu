'use client';

import { cn } from '@/lib/utils';
import type { VisibilityScheduleFields } from '@/types/domain';

// 0=Sun…6=Sat (matches DB/`getDay`), shown Monday-first for MX convention.
const SCHEDULE_DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export function minuteToTimeValue(minute: number | null): string {
  if (minute == null) return '';
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeValueToMinute(value: string): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

/** Extract just the schedule fields from an entity (or empty when absent). */
export function pickSchedule(
  source: VisibilityScheduleFields | null | undefined,
): VisibilityScheduleFields {
  if (!source) {
    return {
      scheduleDays: [],
      scheduleStartMinute: null,
      scheduleEndMinute: null,
      scheduleStartDate: null,
      scheduleEndDate: null,
    };
  }
  return {
    scheduleDays: source.scheduleDays,
    scheduleStartMinute: source.scheduleStartMinute,
    scheduleEndMinute: source.scheduleEndMinute,
    scheduleStartDate: source.scheduleStartDate,
    scheduleEndDate: source.scheduleEndDate,
  };
}

export type ScheduleControlsErrors = {
  scheduleEndMinute?: string;
  scheduleEndDate?: string;
};

/**
 * Presentational controls for a visibility schedule (days + time window + date
 * range). Reused by the item, category, and section editors — it owns no state,
 * just renders `value` and patches via `onChange`.
 */
export function ScheduleControls({
  value,
  onChange,
  errors,
  description,
}: {
  value: VisibilityScheduleFields;
  onChange: (patch: Partial<VisibilityScheduleFields>) => void;
  errors?: ScheduleControlsErrors;
  description: string;
}) {
  function toggleDay(day: number) {
    const next = value.scheduleDays.includes(day)
      ? value.scheduleDays.filter((d) => d !== day)
      : [...value.scheduleDays, day].sort((a, b) => a - b);
    onChange({ scheduleDays: next });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-bold text-ink-900">Horario de visibilidad</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Días (vacío = todos)</legend>
        <div className="flex flex-wrap gap-2">
          {SCHEDULE_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              role="checkbox"
              aria-checked={value.scheduleDays.includes(day.value)}
              onClick={() => toggleDay(day.value)}
              className={cn(
                'rounded-full border-[1.5px] px-3 py-1.5 text-sm font-medium transition-colors',
                value.scheduleDays.includes(day.value)
                  ? 'border-mostaza-500 bg-mostaza-100 text-mostaza-800'
                  : 'border-ink-300 bg-[var(--brand-card)] text-ink-700 hover:border-mostaza-400 hover:bg-[var(--brand-surface)]',
              )}
            >
              {day.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Horas (vacío = todo el día)</legend>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Desde</span>
            <input
              type="time"
              value={minuteToTimeValue(value.scheduleStartMinute)}
              onChange={(e) => onChange({ scheduleStartMinute: timeValueToMinute(e.target.value) })}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Hasta</span>
            <input
              type="time"
              value={minuteToTimeValue(value.scheduleEndMinute)}
              onChange={(e) => onChange({ scheduleEndMinute: timeValueToMinute(e.target.value) })}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
        </div>
        {errors?.scheduleEndMinute && (
          <p className="mt-1.5 text-sm text-red-600">{errors.scheduleEndMinute}</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">
          Fechas (vacío = sin límite)
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Desde</span>
            <input
              type="date"
              value={value.scheduleStartDate ?? ''}
              onChange={(e) => onChange({ scheduleStartDate: e.target.value || null })}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
          <label className="flex flex-col text-sm text-ink-700">
            <span className="mb-1">Hasta</span>
            <input
              type="date"
              value={value.scheduleEndDate ?? ''}
              onChange={(e) => onChange({ scheduleEndDate: e.target.value || null })}
              className="rounded-lg border-[1.5px] border-ink-300 bg-[var(--brand-card)] px-3 py-1.5"
            />
          </label>
        </div>
        {errors?.scheduleEndDate && (
          <p className="mt-1.5 text-sm text-red-600">{errors.scheduleEndDate}</p>
        )}
      </fieldset>
    </div>
  );
}
