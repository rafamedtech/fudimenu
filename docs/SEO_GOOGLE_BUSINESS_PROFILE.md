# SEO del menú público y Google Business Profile

Resumen de lo que FudiMenu emite para descubrimiento/compartir, y cómo conectar
un menú con Google Business Profile (GBP). Alcance: solo discovery/publicación —
sin POS, pedidos ni delivery.

## Qué emite cada menú público (`/m/[slug]`)

Implementado en `src/lib/menu-seo.ts`, consumido por
`src/app/(public)/m/[slug]/page.tsx`.

- **Metadata dinámica** (`buildMenuMetadata`): `title`/`description` por tenant,
  `metadataBase`, canonical (`/m/<slug>`), alternates hreflang `es`/`en`,
  Open Graph (`type=website`, `siteName=FudiMenu`, imagen cover→logo) y Twitter
  card (`summary_large_image` con imagen, `summary` sin ella).
- **JSON-LD** (`buildMenuJsonLd`): un `@graph` schema.org con `Restaurant`
  enlazado a su `Menu` → `MenuSection[]` → `MenuItem[]`. Cada item lleva `Offer`
  (precio decimal, `priceCurrency`, `availability` In/OutOfStock) y
  `suitableForDiet` para tags vegana/vegetariana/sin gluten. Se serializa en un
  `<script type="application/ld+json">` dentro del `<main>`.
- **Deep links compartibles**:
  - Secciones / categorías: anchors `#sec-<sectionId>` y `#cat-<categoryId>`
    (los usa la nav sticky).
  - Items: cada tarjeta tiene `id="item-<itemId>"`. Al abrir el detalle se
    refleja en el hash (`#item-<itemId>`) vía `replaceState`, y al cargar con ese
    hash el island reabre la hoja de detalle del item correcto.

### Validar el JSON-LD

- Tests estructurales: `tests/unit/menu-seo.test.ts`.
- Manual: [Rich Results Test](https://search.google.com/test/rich-results) o
  [Schema Markup Validator](https://validator.schema.org/) con la URL pública o
  pegando el JSON-LD.

## Conectar con Google Business Profile (manual, esta fase)

No hay integración automática con la API de GBP en esta fase. El menú de FudiMenu
es la URL canónica pública; GBP se conecta apuntando a ella:

1. **Reclamar/verificar el negocio** en
   [business.google.com](https://business.google.com) (el dueño del restaurante,
   no FudiMenu).
2. **Website**: poner la URL del menú FudiMenu (`https://<dominio>/m/<slug>`) como
   sitio web del perfil, o el dominio propio del restaurante si redirige al menú.
3. **Menu link**: en *Edit profile → Menu* pegar la misma URL del menú. Para la
   categoría "Restaurant" GBP muestra un campo de enlace de menú directo.
4. **Foto/branding**: subir logo y portada que coincidan con los de FudiMenu para
   una preview consistente (son los mismos assets que alimentan OG/JSON-LD).
5. Tras publicar, validar con Rich Results Test que Google lee el `Restaurant` +
   `Menu` del JSON-LD.

### Futuro (fuera de alcance ahora)

- Automatizar el alta vía Google Business Profile API (requiere OAuth del negocio
  y aprobación de Google). Documentar como tarea aparte si se prioriza.
- `address`/`geo`/`openingHoursSpecification` en el JSON-LD `Restaurant`: el
  schema ya soporta extenderlo; hoy no se emiten porque el modelo `Tenant` no
  captura dirección estructurada (solo `businessHours` como texto libre). Agregar
  cuando exista el dato estructurado.
