import { Skeleton } from '@/components/ui/skeleton';

export default function PublicMenuLoading() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-crema-50">
      <header className="bg-white px-6 py-8 text-center">
        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
        <Skeleton className="mx-auto mt-3 h-6 w-40" />
      </header>
      <div className="flex flex-col gap-3 px-4 pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </main>
  );
}
