import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 shadow-md',
        className,
      )}
      {...props}
    />
  );
}
