import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 shadow-md transition-shadow duration-200 desktop:hover:shadow-lg',
        className,
      )}
      {...props}
    />
  );
}
