import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FudiLogo } from '@/components/brand/fudi-logo';
import { Doodle } from '@/components/brand/doodles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FudiMenu - Tu menú online en menos de 3 minutos',
  description: 'Reemplaza tu PDF por un menú digital editable y accesible desde un QR fijo.',
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[var(--brand-surface)] text-ink-900">
      <header className="mx-auto flex h-24 max-w-[1180px] items-center justify-between px-6 ipad:px-8">
        <FudiLogo />
        <Link href="/login">
          <Button size="md" className="hidden ipad:inline-flex">Entrar</Button>
          <Button size="icon" aria-label="Entrar" className="ipad:hidden">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </header>

      <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 pb-12 pt-6 ipad:px-8 ipad:pb-16 ipad-landscape:grid-cols-[1fr_0.82fr] desktop:gap-14">
        <div className="text-center ipad-landscape:text-left">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary-soft)] px-4 py-2 text-sm font-bold text-[var(--brand-accent-text)] ipad-landscape:mx-0">
            <span className="h-2.5 w-2.5 rounded-full bg-menta-500" />
            Nuevo: soporte multi-sucursal
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[1.05] tracking-[0] ipad:text-6xl ipad-landscape:mx-0 desktop:text-7xl">
            Tu menú vive online en menos de <span className="text-[var(--brand-primary)]">3 minutos.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-ink-500 ipad:text-2xl ipad:leading-9 ipad-landscape:mx-0">
            Reemplaza tu PDF por un menú digital atractivo, siempre actualizado y accesible desde un solo código QR. ¿Ya comió? Su negocio sí.
          </p>
          <div className="mt-9 flex flex-col gap-4 ipad:mx-auto ipad:max-w-xl ipad:flex-row ipad-landscape:mx-0">
            <Link href="/onboarding" className="flex-1">
              <Button size="xl" className="w-full font-black">Crear mi menú gratis</Button>
            </Link>
            <Link href="/m/taqueria-don-pepe" className="flex-1">
              <Button size="xl" variant="outline" className="w-full font-black">
                <Smartphone className="h-5 w-5" />
                Ver demo
              </Button>
            </Link>
          </div>
          <p className="mt-8 text-sm font-semibold text-ink-500 ipad:text-base">
            Únete a +1,000 restaurantes en LATAM
          </p>
        </div>

        <div className="relative min-h-[380px] overflow-hidden rounded-xl border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-card)] shadow-xl ipad:min-h-[520px] ipad-landscape:min-h-[600px]">
          <div className="absolute left-5 top-5 z-10 rounded-lg border border-[var(--brand-card-border)] bg-white px-4 py-3 shadow-lg ipad:left-8 ipad:top-8">
            <p className="text-xs font-bold uppercase text-ink-500">¡Menú actualizado!</p>
            <p className="text-sm font-black text-ink-900">Al instante</p>
          </div>
          <Doodle name="hero" className="absolute inset-x-0 bottom-2 mx-auto h-[330px] w-[405px] ipad:h-[430px] ipad:w-[540px]" />
          <div className="absolute bottom-5 right-5 rounded-lg border border-coral-500/30 bg-white px-4 py-3 shadow-lg">
            <p className="text-xs font-black text-coral-500">Plan agotado</p>
            <p className="text-sm text-ink-500">Oculto del menú</p>
          </div>
        </div>
      </section>
    </main>
  );
}
