'use client';
import { Button } from '@/components/ui/button';

export default function PublicMenuError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">😶‍🌫️</div>
      <h1 className="text-2xl font-bold">Menú no disponible</h1>
      <p className="text-ink-500">Vuelve pronto.</p>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
