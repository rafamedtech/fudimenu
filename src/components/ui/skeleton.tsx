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

export function ItemCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
      <Skeleton className="h-16 w-16 rounded-md" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-12 rounded-full" />
    </div>
  );
}
