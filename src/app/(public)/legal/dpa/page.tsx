// TODO(legal): contenido placeholder. Antes de GA, revisar con abogado.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acuerdo de Procesamiento de Datos (DPA) — FudiMenu',
  description: 'DPA entre FudiMenu y los restaurantes que usan la plataforma.',
};

export default function DpaPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-ink-900">
      <h1 className="text-3xl font-extrabold">Acuerdo de Procesamiento de Datos</h1>
      <p className="mt-2 text-ink-500">Última actualización: 2026-05-05</p>

      <section className="mt-8 space-y-4 text-sm leading-7">
        <h2 className="text-xl font-bold">1. Partes</h2>
        <p>
          Este DPA aplica entre <strong>FudiMenu</strong> (&quot;Procesador&quot;) y el restaurante
          (&quot;Controlador&quot;) que utiliza la plataforma para gestionar su menú digital.
        </p>

        <h2 className="text-xl font-bold">2. Datos procesados</h2>
        <p>
          FudiMenu procesa en nombre del Controlador: nombres de platillos, precios,
          fotografías subidas, configuraciones del menú, datos agregados de visitas
          al menú público (anonimizados).
        </p>

        <h2 className="text-xl font-bold">3. Subprocesadores</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Supabase (autenticación + base de datos PostgreSQL — EE.UU.)</li>
          <li>Cloudinary (almacenamiento de imágenes — EE.UU.)</li>
          <li>Stripe (procesamiento de pagos — EE.UU.)</li>
          <li>Resend (envío de correos transaccionales — EE.UU.)</li>
          <li>PostHog (analytics de producto — EE.UU.)</li>
          <li>Sentry (telemetría de errores — EE.UU.)</li>
          <li>Upstash (rate limiting — Global)</li>
          <li>Vercel (hospedaje — EE.UU.)</li>
        </ul>

        <h2 className="text-xl font-bold">4. Derechos del titular</h2>
        <p>
          El Controlador puede solicitar exportación de datos vía /api/account/export
          y eliminación vía /api/account/delete. FudiMenu cumple con LFPDPPP (México)
          y artículos análogos del GDPR (UE) cuando aplican.
        </p>

        <h2 className="text-xl font-bold">5. Retención</h2>
        <p>
          Soft delete tras solicitud, hard delete a los 30 días. Audit logs retenidos
          90 días. Backups con retención de 7 días (PITR Supabase).
        </p>

        <h2 className="text-xl font-bold">6. Seguridad</h2>
        <p>
          Cifrado en tránsito (TLS 1.2+), en reposo (AES-256 en Supabase). RLS
          (Row-Level Security) por tenant. Audit logs de operaciones críticas.
          Rate limiting en endpoints sensibles.
        </p>

        <h2 className="text-xl font-bold">7. Notificación de incidentes</h2>
        <p>
          En caso de brecha que afecte datos del Controlador, FudiMenu notificará
          dentro de 72 horas.
        </p>

        <h2 className="text-xl font-bold">8. Contacto</h2>
        <p>
          Consultas sobre este DPA:{' '}
          <a className="underline" href="mailto:legal@fudimenu.app">
            legal@fudimenu.app
          </a>
        </p>

        <p className="mt-8 text-xs text-ink-500">
          ⚠️ Este documento es un placeholder. Antes del lanzamiento público, debe ser
          revisado por un abogado especialista en LFPDPPP/GDPR para uso comercial.
        </p>
      </section>
    </main>
  );
}
