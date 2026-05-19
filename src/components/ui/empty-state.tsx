import { Doodle } from '@/components/brand/doodles';

interface EmptyStateProps {
  emoji?: string;
  doodle?: React.ComponentProps<typeof Doodle>['name'];
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = '🌮', doodle = 'empty-menu', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] px-6 py-12 text-center shadow-sm">
      {doodle ? (
        <Doodle name={doodle} className="h-32 w-40 ipad:h-40 ipad:w-52" />
      ) : (
        <div className="text-5xl" aria-hidden>
          {emoji}
        </div>
      )}
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="max-w-xs text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
