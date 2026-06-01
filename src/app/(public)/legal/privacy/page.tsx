import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso de privacidad',
  description: 'Aviso de privacidad de FudiMenu para restaurantes, administradores y comensales.',
  alternates: {
    canonical: '/legal/privacy',
  },
};

const updatedAt = '2 de mayo de 2026';

const sections = [
  {
    title: '1. Responsable',
    body: [
      'FudiMenu es responsable del uso y proteccion de los datos personales tratados en la plataforma, sitio web, panel administrativo, menus publicos, APIs y comunicaciones relacionadas con el servicio.',
      'Para temas de privacidad, derechos ARCO, exportacion o eliminacion de cuenta, puedes escribir a privacidad@fudimenu.app.',
    ],
  },
  {
    title: '2. Datos que recolectamos',
    body: [
      'Datos de cuenta: correo electronico, identificador de usuario, rol, restaurante o sucursal asociada y preferencias de sesion.',
      'Datos del restaurante: nombre comercial, slug publico, logotipo, color de marca, tipo de cocina, moneda, plan contratado, categorias, platillos, precios, imagenes, disponibilidad y especiales del dia.',
      'Datos de uso administrativo: acciones realizadas en el panel, cambios de inventario o menu, descargas de QR, altas, ediciones y bajas logicas.',
      'Datos de comensales: vistas del menu, idioma, referer, user-agent, identificador de sesion y direccion IP anonimizada. En IPv4 truncamos el ultimo octeto; en IPv6 conservamos solo los primeros tres grupos.',
      'Datos de pago: FudiMenu no almacena numeros completos de tarjeta. Stripe procesa pagos, suscripciones, OXXO, SPEI u otros metodos disponibles y nos comparte identificadores de cliente, suscripcion, estado de pago y metadatos necesarios para operar el plan.',
      'Datos de soporte y comunicacion: mensajes, solicitudes, respuestas por correo y evidencia necesaria para atender incidentes, privacidad, facturacion o seguridad.',
    ],
  },
  {
    title: '3. Finalidades',
    body: [
      'Usamos los datos para crear y administrar cuentas, publicar menus digitales, mantener sesiones, mostrar menus a comensales, generar codigos QR, guardar cambios del restaurante y operar funciones de suscripcion.',
      'Tambien los usamos para seguridad, prevencion de abuso, soporte, cumplimiento legal, auditoria interna, facturacion, avisos operativos y medicion agregada del uso del producto.',
      'La analitica del menu se usa para entender que se ve dentro de un menu. Cuando el comensal rechaza cookies no esenciales, PostHog deja de capturar eventos de ese navegador.',
    ],
  },
  {
    title: '4. Quien puede ver los datos',
    body: [
      'El personal autorizado del restaurante puede ver los datos de su propio restaurante segun su rol.',
      'El equipo operativo de FudiMenu puede acceder a datos limitados cuando sea necesario para soporte, seguridad, facturacion, continuidad del servicio o cumplimiento legal.',
      'Proveedores tecnicos pueden procesar datos por cuenta de FudiMenu bajo medidas de confidencialidad: Supabase/Postgres para base de datos y autenticacion, Stripe para pagos, Resend para correo, PostHog para analitica cuando hay consentimiento, servicios de hosting y almacenamiento de imagenes cuando aplique.',
      'No vendemos datos personales. Podemos revelar informacion si una autoridad competente lo requiere o si es necesario para proteger derechos, seguridad, disponibilidad del servicio o investigar abuso.',
    ],
  },
  {
    title: '5. Cookies y analitica',
    body: [
      'Usamos cookies o almacenamiento local para iniciar sesion, recordar preferencias, instalar la PWA, guardar consentimiento y medir uso del menu.',
      'Las cookies estrictamente necesarias permiten operar el servicio. Las cookies de analitica del menu requieren decision del comensal en el banner correspondiente.',
    ],
  },
  {
    title: '6. Conservacion y eliminacion',
    body: [
      'Conservamos datos mientras la cuenta este activa y durante el tiempo necesario para cumplir obligaciones legales, resolver disputas, prevenir abuso y operar respaldos.',
      'Cuando un owner solicita eliminar la cuenta, aplicamos baja logica al tenant, membresias e items, cancelamos suscripciones Stripe asociadas y programamos eliminacion definitiva automatica 30 dias despues.',
      'Tambien puedes solicitar exportacion de datos desde el endpoint de cuenta. Para eliminar o ejercer derechos ARCO, escribe a privacidad@fudimenu.app desde el correo de tu cuenta o usa las herramientas disponibles en el panel.',
    ],
  },
  {
    title: '7. Derechos ARCO y limitacion de uso',
    body: [
      'Puedes solicitar acceso, rectificacion, cancelacion u oposicion al tratamiento de tus datos. La solicitud debe incluir nombre, correo de cuenta, restaurante relacionado, derecho que deseas ejercer, descripcion clara de la solicitud y un medio para responderte.',
      'Podemos pedir verificacion de identidad antes de atender la solicitud. Si el dato pertenece a un restaurante cliente, tambien podremos validar que tengas autorizacion suficiente dentro de ese tenant.',
    ],
  },
  {
    title: '8. Cambios al aviso',
    body: [
      'Podemos actualizar este aviso por cambios legales, tecnicos o del servicio. Publicaremos la version vigente en esta pagina e indicaremos la fecha de ultima actualizacion.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[var(--brand-surface)] px-5 py-10 text-ink-900">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-ink-500 underline">
          Volver a FudiMenu
        </Link>
        <header className="mt-8 border-b border-ink-200 pb-6">
          <p className="text-sm font-bold uppercase tracking-wide text-mostaza-600">
            Aviso de privacidad integral
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">Aviso de privacidad</h1>
          <p className="mt-3 text-sm text-ink-500">Ultima actualizacion: {updatedAt}</p>
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Nota: este documento esta en revision legal externa. No constituye asesoramiento juridico definitivo hasta confirmacion formal.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ink-700">
            Este aviso explica que datos trata FudiMenu, para que los usa, quien puede
            verlos y como puedes exportarlos, corregirlos o eliminarlos.
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
