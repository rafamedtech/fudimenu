'use client';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl" aria-hidden>
        😵
      </div>
      <h1 className="text-2xl font-bold">Algo se quemó en la cocina</h1>
      <p className="text-ink-500">{error.message ?? 'Error inesperado.'}</p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
