interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = '🌮', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-crema-100 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden>
        {emoji}
      </div>
      <h3 className="text-lg font-bold text-ink-900">{title}</h3>
      {description && <p className="max-w-xs text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
