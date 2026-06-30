# Auditoría de UI

Fecha: 2026-06-29

Alcance: superficies públicas, autenticación, onboarding, panel administrativo, componentes compartidos y sistema visual. La implementación asociada a esta auditoría se concentra en la jerarquía de títulos, subtítulos y eyebrows.

## Audit Health Score

| # | Dimensión | Score | Hallazgo principal |
|---|---|---:|---|
| 1 | Accesibilidad | 2/4 | Tres colores de marca configurables no alcanzan contraste AA con el texto elegido automáticamente. |
| 2 | Performance | 3/4 | Uso sólido de Server Components y `next/image`; algunas animaciones decorativas y filtros se ejecutan de forma continua. |
| 3 | Responsive Design | 3/4 | La estructura es mobile-first y los controles principales suelen medir 44 px o más. |
| 4 | Theming | 3/4 | El sistema de tokens es amplio, pero convive con colores directos y lógica de contraste insuficiente. |
| 5 | Anti-Patterns | 2/4 | Los eyebrows fueron eliminados; permanecen tarjetas con borde y sombra, radios excesivos y doodles SVG. |
| **Total** |  | **13/20** | **Aceptable, requiere trabajo sistémico** |

## Anti-Patterns Verdict

El patrón más visible de plantilla, los eyebrows pequeños en mayúsculas, quedó resuelto. La interfaz todavía conserva otros indicadores: cuadrículas repetidas de tarjetas, combinaciones frecuentes de borde con sombra amplia, radios de 20 a 24 px y doodles SVG decorativos.

## Executive Summary

- Audit Health Score: **13/20**
- Issues abiertos: **0 P0, 2 P1, 3 P2**
- Se encontraron y rediseñaron 22 ubicaciones renderizadas con estructura de eyebrow en 13 archivos.
- Estados, badges dietarios, labels de formulario y títulos de grupos de navegación se clasificaron como texto funcional y no como eyebrows.
- La verificación móvil también corrigió desbordamientos en Ajustes, la cuadrícula de secciones y las tarjetas del menú público.
- La base responsive, la semántica general, los estados de carga y el sistema de tokens ofrecen una buena plataforma para corregir los problemas sin rehacer el producto.

## Detailed Findings

### [P1] Contraste incorrecto en colores de marca configurables

- **Location:** `src/lib/brand-theme.ts`, `src/components/admin/brand-settings-form.tsx`
- **Category:** Accessibility / Theming
- **Impact:** Botones y estados que usan `--brand-on-primary` pueden ser difíciles de leer.
- **WCAG/Standard:** WCAG 2.2, 1.4.3 Contrast (Minimum)
- **Evidence:** coral `#FF6B4A` con blanco alcanza 2.82:1, azul `#3B82F6` 3.68:1 y morado `#A855F7` 3.96:1. Los tres quedan por debajo de 4.5:1.
- **Recommendation:** Seleccionar ink o blanco calculando el contraste de ambas opciones, no mediante un umbral fijo de luminancia.
- **Suggested command:** `$impeccable colorize`

### [P1] Movimiento sin alternativa global de reduced motion

- **Location:** `src/app/page.tsx`, `src/app/onboarding/onboarding-client.tsx`, `src/components/admin/activation-checklist.tsx`, `src/app/globals.css`, `tailwind.config.ts`
- **Category:** Accessibility / Performance
- **Impact:** Usuarios sensibles al movimiento siguen recibiendo ping, float, fade y transiciones de escala.
- **WCAG/Standard:** WCAG 2.2, 2.3.3 Animation from Interactions
- **Evidence:** No hay reglas `prefers-reduced-motion` en el código de UI.
- **Recommendation:** Añadir una política global de movimiento reducido y desactivar las animaciones decorativas.
- **Suggested command:** `$impeccable animate`

### [P1][Resuelto] Eyebrows repetitivos debilitan la jerarquía

- **Location:** menú, ajustes, marca, QR, analytics, límites de plan, legales, referral y detalle público.
- **Category:** Anti-Pattern / Accessibility
- **Impact:** El texto contextual compite con el título, agrega ruido y obliga a leer tres niveles donde dos son suficientes.
- **Evidence:** 22 ubicaciones renderizadas en 13 archivos usan texto pequeño, mayúsculas y tracking amplio sobre un título.
- **Recommendation:** Eliminar categorías redundantes, convertir contexto útil en subtítulos normales y mover estados de plan a badges junto al título.
- **Suggested command:** `$impeccable typeset`
- **Resolution:** Se introdujo un encabezado compartido, se reescribió el contexto como copy útil y la búsqueda estructural final no encontró eyebrows sobre headings.

### [P2] Borde y sombra aparecen juntos de forma sistemática

- **Location:** landing, dashboard, ajustes, menú, QR y componentes de diálogo.
- **Category:** Anti-Pattern
- **Impact:** Demasiadas superficies parecen flotar y la jerarquía por elevación pierde significado.
- **Recommendation:** Asignar borde o elevación según función y reservar sombras amplias para overlays.
- **Suggested command:** `$impeccable quieter`

### [P2] Radios de tarjeta exceden el vocabulario del producto

- **Location:** `src/components/menu/item-card.tsx`, onboarding, dashboard y varias cards compartidas.
- **Category:** Anti-Pattern
- **Impact:** Las superficies se sienten infladas y reducen la densidad útil en móvil.
- **Recommendation:** Limitar tarjetas a 12 o 16 px; conservar pills solo para badges y controles compactos.
- **Suggested command:** `$impeccable polish`

### [P2] Colores directos conviven con tokens semánticos

- **Location:** estados, errores, materiales QR y componentes auxiliares.
- **Category:** Theming
- **Impact:** Cambios de marca y ajustes de contraste requieren editar múltiples componentes.
- **Recommendation:** Crear roles semánticos para success, warning, danger y contenido impreso; mantener valores directos solo en assets generados.
- **Suggested command:** `$impeccable colorize`

## Inventario de Eyebrows

### Rediseñados

- `src/app/(admin)/menu/page.tsx`: “Centro de operaciones”.
- `src/components/admin/section-grid.tsx`: “Arquitectura del menú”.
- `src/app/(admin)/settings/page.tsx`: cinco encabezados de sección.
- `src/app/(admin)/settings/brand/page.tsx`: “Tu identidad”.
- `src/components/admin/brand-settings-form.tsx`: cuatro categorías de campo y “En vivo”.
- `src/app/(admin)/qr/page.tsx`: “Tu código QR” y “Cómo usarlo”.
- `src/app/(admin)/qr/qr-materials.tsx`: “Materiales descargables”.
- `src/app/(admin)/analytics/page.tsx`: etiqueta Pro encima del título.
- `src/app/(admin)/menu/[id]/page.tsx`: Plan Free encima del límite.
- `src/app/(public)/legal/privacy/page.tsx`: descriptor que repite el título.
- `src/app/(public)/legal/terms/page.tsx`: descriptor que repite el título.
- `src/app/(public)/r/[code]/page.tsx`: invitación encima del título.
- `src/app/(public)/m/[slug]/public-menu-island.tsx`: categoría encima del nombre del platillo.

### Conservar como texto funcional

- Estados: activo, agotado, especial y pronto.
- Badges dietarios y de alérgenos.
- Labels de inputs y metadatos de cuenta.
- Encabezados de grupos en la navegación lateral.
- Progreso de activación.
- Selector de idioma y separador de proveedores de login.

## Positive Findings

- Arquitectura mobile-first consistente en app y menú público.
- Controles compartidos con objetivos táctiles de al menos 44 px.
- Uso extendido de Server Components, `next/image`, skeletons y límites de ancho.
- Tokens de marca dinámicos con superficies derivadas del color del restaurante.
- Landmarks, headings, labels y atributos ARIA presentes en los flujos principales.

## Verification

- `tsc --noEmit`: sin errores.
- ESLint dirigido a los archivos modificados: sin errores ni warnings.
- Vitest dirigido: 2 archivos, 6 tests aprobados.
- Búsqueda estructural de texto uppercase/tracked inmediatamente antes de `h1`, `h2` o `h3`: 0 resultados.
- Navegador: Ajustes, Marca, Menú, QR, Analytics, Legales y Menú público revisados.
- Viewports: 390 × 844 y 1280 × 720.
- Ancho móvil final: Ajustes 375/375, Menú 375/375 y Menú público 390/390, sin scroll horizontal.

## Recommended Actions

1. **[P1] `$impeccable colorize`**: corregir la selección automática de contraste.
2. **[P1] `$impeccable animate`**: respetar movimiento reducido.
3. **[P2] `$impeccable quieter`**: racionalizar bordes, sombras y elevación.
4. **[P2] `$impeccable polish`**: unificar radios, estados y tokens restantes.

Repetir `$impeccable audit` después de las correcciones para medir el cambio.
