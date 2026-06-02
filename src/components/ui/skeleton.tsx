import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-gradient-to-r from-crema-100 via-ink-100 to-crema-100 bg-[length:200%_100%]',
        className,
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 shadow-md ipad:p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-5 rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-4 shadow-md ipad:p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="size-6 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
