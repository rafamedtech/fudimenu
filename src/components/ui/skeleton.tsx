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

function ItemCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[var(--brand-card)] p-3 shadow-sm">
      <Skeleton className="size-16 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-12 rounded-full" />
    </div>
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

function AdminRouteSkeleton() {
  return (
    <main className="flex flex-col gap-4 px-4 pb-8 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
      <Skeleton className="h-32 w-full rounded-lg ipad:h-40" />
      <div className="grid gap-3 ipad:grid-cols-2 ipad:gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid gap-3 ipad:grid-cols-2 ipad-landscape:grid-cols-3">
        <ItemCardSkeleton />
        <ItemCardSkeleton />
        <ItemCardSkeleton />
      </div>
    </main>
  );
}
