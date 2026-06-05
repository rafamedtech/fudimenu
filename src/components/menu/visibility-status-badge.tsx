import {
  getScheduleStatus,
  hasSchedule,
  type ScheduleStatus,
} from '@/lib/visibility-schedule';
import type { VisibilityScheduleFields } from '@/types/domain';

const STATUS_STYLES: Record<ScheduleStatus, { label: string; className: string; dot: string }> = {
  visible: {
    label: 'Visible ahora',
    className: 'border-green-300 bg-green-50 text-green-800',
    dot: 'bg-green-500',
  },
  scheduled: {
    label: 'Programado',
    className: 'border-blue-300 bg-blue-50 text-blue-800',
    dot: 'bg-blue-500',
  },
  out_of_window: {
    label: 'Fuera de horario',
    className: 'border-ink-200 bg-[var(--brand-surface-strong)] text-ink-500',
    dot: 'bg-ink-300',
  },
};

/**
 * Admin-only badge showing whether scheduled content is live right now. Renders
 * nothing for always-visible content (no schedule) to avoid badge clutter.
 */
export function VisibilityStatusBadge({
  schedule,
  timezone,
}: {
  schedule: VisibilityScheduleFields;
  timezone: string | null;
}) {
  if (!hasSchedule(schedule)) return null;

  const status = getScheduleStatus(schedule, new Date(), timezone ?? undefined);
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {style.label}
    </span>
  );
}
