import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terminos y condiciones | FudiMenu',
  description: 'Terminos de uso de FudiMenu para restaurantes, administradores y comensales.',
};

const updatedAt = '2 de mayo de 2026';

const sections = [
  {
    title: '1. Aceptacion',
    body: [
      'Estos terminos regulan el acceso y uso de FudiMenu, incluyendo el panel administrativo, menus publicos, APIs, PWA, codigos QR, herramientas de analitica, facturacion y comunicaciones relacionadas.',
      'Al crear una cuenta, administrar un restaurante o usar un menu publicado en FudiMenu, aceptas estos terminos y el Aviso de privacidad.',
    ],
  },
  {
    title: '2. Servicio',
    body: [
      'FudiMenu permite a restaurantes crear, editar y publicar menus digitales, organizar categorias, platillos, precios, imagenes, disponibilidad, especiales y codigos QR.',
      'Los restaurantes son responsables de la veracidad de su menu, precios, promociones, alergenos, disponibilidad, imagenes, impuestos, permisos y cumplimiento aplicable a alimentos, publicidad y consumo.',
    ],
  },
  {
    title: '3. Cuentas, roles y seguridad',
    body: [
      'Debes mantener segura tu cuenta y avisarnos si detectas uso no autorizado. Las acciones realizadas desde una cuenta autenticada se consideran realizadas por su titular o por personal autorizado del restaurante.',
      'El owner del tenant puede administrar la cuenta del restaurante, sus usuarios, plan, datos publicados y solicitudes de eliminacion. Staff y admins pueden tener permisos limitados segun la configuracion del producto.',
    ],
  },
  {
    title: '4. Datos del restaurante y comensales',
    body: [
      'El restaurante conserva responsabilidad sobre la informacion que sube a FudiMenu. Nos otorgas una licencia limitada para alojar, mostrar, procesar y transmitir ese contenido con el fin de prestar el servicio.',
      'FudiMenu recolecta datos tecnicos y de uso para operar el servicio. La politica de privacidad lista los datos recolectados, finalidades, quienes los ven y como exportar o eliminar informacion.',
    ],
  },
  {
    title: '5. Pagos y suscripciones',
    body: [
      'Los pagos se procesan mediante Stripe u otros proveedores disponibles. FudiMenu no almacena numeros completos de tarjeta.',
      'Los planes, precios, beneficios, pruebas, renovaciones o cancelaciones se muestran en el panel o en el checkout. Al contratar un plan, autorizas los cargos correspondientes conforme a las condiciones aceptadas en Stripe.',
      'Si solicitas eliminar la cuenta, FudiMenu intentara cancelar suscripciones Stripe asociadas al tenant antes de aplicar la baja logica.',
    ],
  },
  {
    title: '6. Uso permitido',
    body: [
      'No puedes usar FudiMenu para publicar contenido ilegal, enganoso, discriminatorio, que infrinja derechos de terceros, que contenga malware, que intente evadir limites tecnicos o que afecte la disponibilidad del servicio.',
      'Podemos suspender o limitar cuentas cuando exista riesgo de abuso, fraude, incumplimiento, afectacion tecnica, reclamacion legal o uso contrario a estos terminos.',
    ],
  },
  {
    title: '7. Eliminacion y exportacion',
    body: [
      'El owner puede solicitar exportacion de datos del tenant activo y eliminacion de la cuenta mediante los endpoints o herramientas disponibles. Por seguridad y cumplimiento, algunas acciones pueden requerir autenticacion y limites de frecuencia.',
      'La eliminacion de cuenta aplica baja logica a tenant, membresias e items. La eliminacion definitiva automatica ocurre 30 dias despues, salvo que exista obligacion legal, disputa, investigacion de abuso o respaldo tecnico que justifique conservar datos por mas tiempo.',
    ],
  },
  {
    title: '8. Disponibilidad y cambios',
    body: [
      'Trabajamos para mantener el servicio disponible, pero no garantizamos operacion ininterrumpida o libre de errores. Podemos modificar, suspender o descontinuar funciones para mejorar el producto, cumplir obligaciones o proteger la plataforma.',
      'Podemos actualizar estos terminos. La version vigente se publicara en esta pagina con fecha de ultima actualizacion.',
    ],
  },
  {
    title: '9. Contacto',
    body: [
      'Para soporte, privacidad, pagos o dudas legales, escribe a privacidad@fudimenu.app o usa los canales disponibles dentro del producto.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-dvh bg-crema-50 px-5 py-10 text-ink-900">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-ink-500 underline">
          Volver a FudiMenu
        </Link>
        <header className="mt-8 border-b border-ink-200 pb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-mostaza-600">
            Terminos del servicio
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">Terminos y condiciones</h1>
          <p className="mt-3 text-sm text-ink-500">Ultima actualizacion: {updatedAt}</p>
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Nota: este documento esta en revision legal externa. No constituye asesoramiento juridico definitivo hasta confirmacion formal.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
            Estos terminos explican las reglas de uso de FudiMenu para restaurantes,
            administradores y personas que consultan menus publicados.
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-extrabold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-ink-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-ink-200 pt-5 text-sm font-semibold text-ink-500">
          <Link href="/legal/dpa" className="underline">
            Acuerdo de Procesamiento de Datos (DPA)
          </Link>
        </footer>
      </article>
    </main>
  );
}
