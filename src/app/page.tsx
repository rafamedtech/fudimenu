import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="text-6xl" aria-hidden>
        🌮
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">FudiMenu</h1>
      <p className="text-lg text-ink-700">
        El menú de tu restaurante, sin PDFs que tarden una vida.
      </p>
      <div className="mt-6 flex w-full flex-col gap-3">
        <Link href="/onboarding">
          <Button size="lg" className="w-full">
            Empezar gratis
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="w-full">
            Ya tengo cuenta
          </Button>
        </Link>
        <Link
          href="/m/taqueria-don-pepe"
          className="mt-2 text-sm text-ink-500 underline"
        >
          Ver demo del menú comensal →
        </Link>
      </div>
    </main>
  );
}
