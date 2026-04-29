import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="text-2xl font-bold">Por aquí no hay nada</h1>
      <p className="text-ink-500">Esta página no existe o se mudó.</p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </main>
  );
}
