import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  Smartphone,
  SmartphoneNfc,
  Store,
  Zap,
} from 'lucide-react';
import { FudiLogo } from '@/components/brand/fudi-logo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FudiMenu - Tu menú online en menos de 3 minutos',
  description: 'Reemplaza tu PDF por un menú digital editable y accesible desde un QR fijo.',
  openGraph: {
    title: 'FudiMenu - Tu menú online en menos de 3 minutos',
    description: 'Reemplaza tu PDF por un menú digital editable y accesible desde un QR fijo.',
    type: 'website',
    images: [
      {
        url: 'https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/T5aFVdCanUY/components/Jwn81WUoCdH.png',
        width: 720,
        height: 620,
        alt: 'FudiMenu — menú digital para restaurantes',
      },
    ],
  },
};

const heroImage =
  'https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/T5aFVdCanUY/components/Jwn81WUoCdH.png';

const faces = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
];

const benefits = [
  {
    title: 'Un QR para siempre',
    description:
      'Imprime tu QR una sola vez. Cambia precios, agrega platillos o oculta agotados sin volver a imprimir.',
    Icon: SmartphoneNfc,
  },
  {
    title: 'Súper rápido',
    description:
      'Tus clientes ven el menú al instante, sin descargar PDFs pesados ni hacer zoom molesto.',
    Icon: Zap,
  },
  {
    title: 'Con tu identidad',
    description:
      'Personaliza colores, logo y estilo para que el menú se sienta 100% parte de tu restaurante.',
    Icon: Store,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--brand-surface)] text-ink-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-[var(--brand-card)] focus:px-4 focus:py-3 focus:font-bold focus:text-ink-900 focus:shadow-md"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-50 w-full border-b border-[var(--brand-card-border)] bg-[var(--brand-surface-translucent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-6 ipad:h-20 ipad:px-8">
          <FudiLogo markClassName="h-12" textClassName="text-xl" />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm font-semibold text-ink-700 transition-colors hover:text-[var(--brand-accent-text)] sm:block"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--brand-primary)] px-5 text-sm font-bold text-[var(--brand-on-primary)] shadow-sm transition-all hover:bg-[var(--brand-primary-hover)] active:scale-95"
            >
              Empezar
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <section className="relative mx-auto max-w-[1180px] px-6 pb-20 pt-16 ipad:px-8 ipad:pt-24 ipad-landscape:pb-28 ipad-landscape:pt-32">
          <div className="grid items-center gap-12 ipad-landscape:grid-cols-2 ipad-landscape:gap-8">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center ipad-landscape:mx-0 ipad-landscape:items-start ipad-landscape:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-[var(--brand-primary-soft)] px-3 py-1 text-sm font-semibold text-[var(--brand-accent-text)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-menta-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-menta-500" />
                </span>
                Multi-sucursal ya disponible
              </div>

              <h1 className="font-heading max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-ink-900 ipad:text-5xl ipad-landscape:text-6xl" style={{ letterSpacing: '-0.025em' }}>
                Tu menú vive online en menos de{' '}
                <span className="text-[var(--brand-primary)]">3 minutos.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-ink-500 ipad:text-xl">
                Reemplaza tu PDF por un menú digital atractivo, siempre actualizado y accesible
                desde un solo código QR. ¿Ya comió? Su negocio sí.
              </p>

              <div className="mt-8 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-md bg-[var(--brand-primary)] px-8 text-base font-bold text-[var(--brand-on-primary)] shadow-sm transition-all hover:bg-[var(--brand-primary-hover)] active:scale-95 sm:w-auto"
                >
                  Crear mi menú gratis
                </Link>
                <Link
                  href="/m/brunette-demo"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-[var(--brand-card-border)] bg-[var(--brand-card)] px-8 text-base font-semibold text-ink-900 shadow-sm transition-all hover:bg-[var(--brand-surface-strong)] active:scale-95 sm:w-auto"
                >
                  <Smartphone className="size-5 text-ink-500" aria-hidden="true" />
                  Ver demo
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-4 text-sm text-ink-500">
                <div className="flex">
                  {faces.map((src) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      width={32}
                      height={32}
                      className="-ml-2 size-8 rounded-full object-cover ring-2 ring-[var(--brand-surface)] first:ml-0"
                    />
                  ))}
                </div>
                <p>Únete a +847 restaurantes en LATAM</p>
              </div>
            </div>

            <div id="demo" className="relative mx-auto flex w-full max-w-lg justify-center ipad-landscape:max-w-none ipad-landscape:justify-end">
              <div className="absolute inset-0 -z-10 m-auto size-[80%] rounded-full bg-[var(--brand-primary-faint)] blur-3xl" />
              <Image
                src={heroImage}
                alt="Ilustración de platillo, celular y QR"
                width={720}
                height={620}
                priority
                className="h-auto max-h-[400px] w-full object-contain drop-shadow-sm ipad-landscape:max-h-[500px]"
              />

              <div className="absolute left-0 top-8 flex animate-float items-center gap-3 rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 shadow-lg sm:-left-6 ipad:top-12">
                <div className="rounded-md bg-menta-100 p-2 text-menta-600">
                  <Check className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-black">Menú actualizado</p>
                  <p className="text-[10px] text-ink-500">Al instante</p>
                </div>
              </div>

              <div className="absolute bottom-6 right-0 flex animate-float-slow items-center gap-3 rounded-lg border border-[var(--brand-card-border)] bg-[var(--brand-card)] p-3 shadow-lg sm:-right-4 ipad:bottom-10">
                <div className="rounded-md bg-coral-100 p-2 text-coral-500">
                  <AlertCircle className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-black text-ink-500 line-through">Flan agotado</p>
                  <p className="text-[10px] font-semibold text-coral-500">Oculto del menú</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--brand-card-border)] bg-[var(--brand-surface-strong)] py-16 ipad:py-20">
          <div className="mx-auto max-w-[1180px] px-6 ipad:px-8">
            <div className="grid grid-cols-1 divide-y divide-[var(--brand-card-border)] ipad-landscape:grid-cols-3 ipad-landscape:divide-x ipad-landscape:divide-y-0">
              {benefits.map(({ title, description, Icon }, i) => (
                <div key={title} className="flex flex-col gap-4 py-10 ipad-landscape:px-10 ipad-landscape:py-8 first:pt-0 last:pb-0 ipad-landscape:first:pl-0 ipad-landscape:last:pr-0 ipad-landscape:first:pt-8 ipad-landscape:last:pb-8">
                  <div className="flex items-start justify-between">
                    <span className="font-heading text-5xl font-black text-[var(--brand-primary)] opacity-25 ipad:text-6xl">
                      0{i + 1}
                    </span>
                    <Icon className="size-7 text-ink-300" aria-hidden="true" />
                  </div>
                  <h2 className="font-heading text-xl font-black text-ink-900">{title}</h2>
                  <p className="text-sm leading-7 text-ink-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--brand-card-border)] bg-[var(--brand-surface)] py-12">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 px-6 ipad:flex-row ipad:gap-4 ipad:px-8">
          <FudiLogo markClassName="h-12 opacity-75" textClassName="text-lg text-ink-500" />
          <div className="flex flex-col items-center gap-3 ipad:flex-row ipad:gap-6">
            <nav aria-label="Legal" className="flex items-center gap-4 text-sm text-ink-500">
              <Link href="/legal/privacy" className="hover:text-ink-900 transition-colors">
                Privacidad
              </Link>
              <Link href="/legal/terms" className="hover:text-ink-900 transition-colors">
                Términos
              </Link>
            </nav>
            <p className="text-sm text-ink-500">© 2026 FudiMenu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
