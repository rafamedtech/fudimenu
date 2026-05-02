import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DPA | FudiMenu',
  description: 'Acuerdo de tratamiento de datos para tenants Pro y superiores en FudiMenu.',
};

const updatedAt = '2 de mayo de 2026';

const sections = [
  {
    title: '1. Alcance',
    body: [
      'Este Data Processing Addendum o DPA aplica a tenants Pro, Business o planes superiores que usan FudiMenu para administrar menus digitales, personal del restaurante, analitica, codigos QR, pagos y comunicaciones relacionadas.',
      'El DPA complementa los Terminos y condiciones y el Aviso de privacidad. Si existe contradiccion, este DPA prevalece respecto del tratamiento de datos personales procesados por FudiMenu por cuenta del tenant.',
    ],
  },
  {
    title: '2. Roles',
    body: [
      'El tenant actua como responsable o controlador de los datos personales que decide cargar, administrar o publicar en FudiMenu, incluyendo datos de su restaurante, personal autorizado, contenido del menu y datos derivados del uso de su menu.',
      'FudiMenu actua como encargado o procesador cuando trata esos datos para prestar el servicio conforme a las instrucciones documentadas del tenant.',
      'FudiMenu puede actuar como responsable independiente para datos necesarios de cuenta, facturacion, seguridad, cumplimiento legal, soporte, prevencion de abuso y administracion interna del servicio.',
    ],
  },
  {
    title: '3. Datos tratados',
    body: [
      'Datos de tenant: nombre comercial, slug, logotipo, color, tipo de cocina, moneda, plan, configuraciones, sucursales cuando aplique y metadatos administrativos.',
      'Datos de usuarios del tenant: identificador de usuario, correo, rol, membresia, acciones administrativas y registros de auditoria.',
      'Datos de menu: categorias, platillos, descripciones, precios, imagenes, disponibilidad, especiales, traducciones y cambios historicos necesarios para operar el servicio.',
      'Datos de comensales: vistas del menu, idioma, referer, user-agent, sesion, consentimiento de cookies e IP anonimizada.',
      'Datos de pago y soporte: identificadores de Stripe, estado de suscripcion, comunicaciones de soporte y mensajes operativos.',
    ],
  },
  {
    title: '4. Finalidades autorizadas',
    body: [
      'FudiMenu procesara datos para alojar, publicar y administrar menus; autenticar usuarios; aplicar roles; operar analitica; generar QR; enviar correos operativos; procesar pagos; dar soporte; mantener seguridad; prevenir abuso; ejecutar exportaciones o eliminaciones; y cumplir obligaciones legales.',
      'FudiMenu no usara datos del tenant para vender bases de datos, perfilar comensales fuera del servicio o entrenar modelos de terceros sin autorizacion documentada.',
    ],
  },
  {
    title: '5. Instrucciones del tenant',
    body: [
      'Las instrucciones del tenant se documentan en los Terminos, este DPA, el Aviso de privacidad, la configuracion del producto, solicitudes autenticadas en el panel, endpoints disponibles y comunicaciones de soporte verificadas.',
      'Si FudiMenu considera que una instruccion infringe ley aplicable o pone en riesgo la plataforma, podra rechazarla o pedir confirmacion antes de ejecutarla.',
    ],
  },
  {
    title: '6. Subencargados',
    body: [
      'FudiMenu puede usar subencargados para prestar el servicio, incluyendo infraestructura, base de datos, autenticacion, pagos, correo, analitica, hosting, almacenamiento de imagenes, monitoreo y soporte.',
      'Subencargados actuales o esperados incluyen Supabase/Postgres, Stripe, Resend, PostHog cuando hay consentimiento, proveedores de hosting y proveedores de almacenamiento de imagenes cuando aplique.',
      'FudiMenu exigira a subencargados medidas contractuales y tecnicas razonables para proteger datos personales. El tenant autoriza el uso de estos subencargados para las finalidades del servicio.',
    ],
  },
  {
    title: '7. Seguridad',
    body: [
      'FudiMenu mantendra medidas administrativas, tecnicas y organizativas razonables, proporcionales al riesgo y al tamano del servicio: control de acceso por rol, autenticacion, segregacion por tenant, registros de auditoria, HTTPS, minimizacion, baja logica, respaldo operativo y controles de acceso a proveedores.',
      'El tenant debe proteger credenciales, asignar roles correctamente, retirar accesos de personal que ya no colabore y mantener veraz la informacion que publica.',
    ],
  },
  {
    title: '8. Incidentes',
    body: [
      'Si FudiMenu confirma un incidente de seguridad que afecte datos personales del tenant, notificara sin demora indebida a los contactos disponibles, con informacion razonable sobre naturaleza del incidente, datos afectados, medidas adoptadas y acciones recomendadas.',
      'El tenant es responsable de sus propias obligaciones de notificacion a titulares o autoridades cuando legalmente correspondan.',
    ],
  },
  {
    title: '9. Derechos de titulares',
    body: [
      'Cuando una persona ejerza derechos ARCO u otros derechos aplicables sobre datos controlados por el tenant, FudiMenu apoyara razonablemente mediante exportacion, correccion o eliminacion disponible en el producto o por soporte verificado.',
      'Si FudiMenu recibe una solicitud directamente y puede identificar que corresponde al tenant, podra redirigirla al tenant o atenderla cuando la ley lo permita y la identidad quede verificada.',
    ],
  },
  {
    title: '10. Transferencias y ubicacion',
    body: [
      'El tenant reconoce que los proveedores tecnicos pueden procesar datos fuera de Mexico. FudiMenu adoptara medidas razonables para que dichas transferencias o remisiones se realicen conforme a obligaciones contractuales y de seguridad aplicables.',
    ],
  },
  {
    title: '11. Devolucion y eliminacion',
    body: [
      'Los tenants Pro+ pueden solicitar exportacion de datos del tenant activo, sujeta a autenticacion y limites de frecuencia.',
      'Al eliminar una cuenta, FudiMenu aplica baja logica al tenant, membresias e items, cancela suscripciones Stripe asociadas y programa eliminacion definitiva automatica 30 dias despues, salvo obligacion legal, disputa, investigacion de abuso o respaldo tecnico que justifique conservacion adicional.',
    ],
  },
  {
    title: '12. Auditoria y cumplimiento',
    body: [
      'FudiMenu puede proporcionar informacion razonable sobre sus practicas de seguridad y privacidad. Auditorias tecnicas directas requeriran acuerdo previo, alcance limitado, confidencialidad y que no comprometan seguridad de otros tenants.',
      'Este template no sustituye asesoria legal. Tenants con requerimientos regulatorios especiales pueden solicitar un DPA firmado o condiciones adicionales para planes empresariales.',
    ],
  },
];

export default function DpaPage() {
  return (
    <main className="min-h-dvh bg-crema-50 px-5 py-10 text-ink-900">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-ink-500 underline">
          Volver a FudiMenu
        </Link>
        <header className="mt-8 border-b border-ink-200 pb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-mostaza-600">
            Data Processing Addendum
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">DPA para tenants Pro+</h1>
          <p className="mt-3 text-sm text-ink-500">Ultima actualizacion: {updatedAt}</p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
            Template de acuerdo de tratamiento de datos para restaurantes que usan
            FudiMenu en planes Pro, Business o superiores.
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
      </article>
    </main>
  );
}
