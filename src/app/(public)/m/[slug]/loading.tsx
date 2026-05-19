import { Skeleton } from '@/components/ui/skeleton';

export default function PublicMenuLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[var(--brand-surface)] ipad:max-w-[744px] ipad-landscape:max-w-[984px] desktop:max-w-[1180px] desktop:border-x desktop:border-[var(--brand-card-border)]">
      <header className="bg-[var(--brand-card)] px-6 py-8 text-center">
        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-6 w-40" />
      </header>
      <div className="grid gap-3 px-4 pt-6 ipad:grid-cols-2 ipad:px-6 ipad-landscape:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
