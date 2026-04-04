# FudiMenu

Base inicial del MVP de FudiMenu lista para continuar construcción sobre:

- Nuxt 4
- TypeScript
- Nuxt UI v4
- PostgreSQL
- Prisma ORM
- Supabase Auth
- `@nuxtjs/supabase`

La app usa la estructura moderna de Nuxt 4 con `app/`, mantiene `server/` en root para server routes y usa PostgreSQL + Prisma como fuente principal de verdad del dominio.

## Estado del setup

Ya queda configurado:

- Nuxt 4 con `app/`
- Nuxt UI v4
- Supabase para auth y sesión
- Prisma 7 con PostgreSQL
- `schema.prisma` inicial para el MVP
- migración inicial
- seed mínima con restaurantes demo
- layouts y páginas base para continuar en el siguiente thread

## Requisitos

- Node.js 20+
- pnpm 10+
- base de datos PostgreSQL accesible
- proyecto de Supabase configurado

## Variables de entorno

Copia el ejemplo:

```bash
cp .env.example .env
```

Variables requeridas:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NUXT_PUBLIC_SITE_URL`
- `DEMO_OWNER_EMAIL`

Nota importante:

- `SUPABASE_ANON_KEY` es el nombre oficial usado por el proyecto.
- Si antes veías referencias a `SUPABASE_KEY`, aquí queda reemplazado por `SUPABASE_ANON_KEY`.

## Instalar dependencias

```bash
pnpm install
```

## Prisma y base de datos

Generar cliente:

```bash
pnpm db:generate
```

Correr migración inicial en desarrollo:

```bash
pnpm db:migrate
```

Correr seed mínima:

```bash
pnpm db:seed
```

Validar schema:

```bash
pnpm prisma validate
```

## Levantar el proyecto

Servidor local:

```bash
pnpm dev
```

Validar tipos:

```bash
pnpm typecheck
```

Build de producción:

```bash
pnpm build
```

Preview local:

```bash
pnpm preview
```

## Testing

La base de testing queda separada por capa:

- `pnpm test:unit` para utilidades, validaciones y reglas de permisos aisladas
- `pnpm test:integration` para endpoints y comportamiento de Nuxt/Nitro con `@nuxt/test-utils`
- `pnpm test:components` para component testing en navegador real con Vitest Browser Mode + Playwright provider
- `pnpm test:e2e` para flujos en navegador con Playwright
- `pnpm test:e2e:ui` para la suite de protección visual y accesible de rutas críticas
- `pnpm test:e2e:update` para regenerar screenshots y snapshots ARIA cuando un cambio visual o semántico sea intencional
- `pnpm test:coverage` para coverage de unit e integration
- `pnpm test:all` para correr todo junto

Si es la primera vez que corres Playwright en tu máquina:

```bash
pnpm test:e2e:install
```

La suite E2E usa fixtures de prueba activadas por entorno para no depender de una base real al validar home pública, detalle de restaurante y protección del dashboard.

### Component tests con Vitest Browser Mode

La base de component testing usa:

- `Vitest Browser Mode`
- provider de `Playwright`
- entorno `nuxt` de `@nuxt/test-utils`

Objetivo inicial:

- blindar markup real de componentes reutilizables
- proteger jerarquía y estructura accesible básica
- validar estados condicionales importantes
- cubrir interacciones simples de formularios y managers del dashboard

Cobertura inicial de componentes:

- `RestaurantCard`
- `MenuCategorySection`
- `DashboardRestaurantForm`
- `CategoryManager`
- `MenuItemManager`

Los component tests viven en:

- `tests/components/restaurants/`
- `tests/components/menu/`
- `tests/components/dashboard/`
- `tests/setup/`

Cómo correrlos:

```bash
pnpm test:components
```

Modo watch:

```bash
pnpm test:components:watch
```

Estos tests usan un viewport móvil por defecto y montan componentes dentro del runtime real de Nuxt para que los primitives, plugins y auto-imports se comporten como en la aplicación.

### UI protection con Playwright

La protección de UI del MVP combina dos capas:

- screenshots para detectar regresiones visuales en layout, jerarquía y composición
- snapshots ARIA para detectar cambios problemáticos en markup, landmarks, headings, navegación y controles

Cobertura inicial:

- `/`
- `/r/brasa-norte`
- `/login`
- `/dashboard`
- `/dashboard/restaurants`
- `/dashboard/restaurants/restaurant-brasa/menu`

Los tests visuales y accesibles viven en:

- `tests/e2e/public/`
- `tests/e2e/dashboard/`
- `tests/e2e/accessibility/`
- `tests/e2e/helpers/`
- `tests/setup/`

El runner usa una variante desktop y una mobile-first para las rutas críticas. Además, desactiva animaciones durante snapshots, genera `trace` al reintentar y usa fixtures controladas para que los resultados sean reproducibles.

### Cómo correr los tests de UI

Suite completa E2E:

```bash
pnpm test:e2e
```

Solo protección visual/accesible:

```bash
pnpm test:e2e:ui
```

### Cómo actualizar baselines

Actualiza screenshots y snapshots solo cuando el cambio en la UI o en la estructura accesible sea intencional:

```bash
pnpm test:e2e:update
```

Después revisa cuidadosamente:

- archivos nuevos o modificados en `tests/e2e/__snapshots__/`
- diffs visuales en Playwright
- cualquier cambio inesperado en headings, botones, labels, navegación o landmarks

No conviene actualizar snapshots como primer paso si hubo una regresión inesperada; primero hay que entender la causa y corregirla.

## Seed demo incluida

La seed deja una base mínima útil para probar el MVP:

- owner demo identificado por `DEMO_OWNER_EMAIL`
- 1 o 2 restaurantes demo
- categorías demo
- platillos demo

La autenticación sigue en Supabase; Prisma guarda el modelo de negocio y sincroniza el usuario cuando existe sesión.

## Estructura principal

```text
app/
  assets/
  components/
  composables/
  layouts/
  middleware/
  pages/
  plugins/
  types/
server/
  api/
  utils/
lib/
types/
prisma/
generated/
public/
```

## Notas técnicas

- `~` apunta a `app/`.
- `~~` apunta a la raíz del proyecto.
- Prisma 7 usa [prisma.config.ts](/Users/rafamed/dev/proyectos/fudimenu/prisma.config.ts) y genera cliente en `generated/prisma/`.
- Supabase se usa principalmente para auth y sesión.
- El dominio del negocio vive en PostgreSQL con Prisma.
- Los tests viven bajo `tests/` y usan `Vitest`, `@nuxt/test-utils` y `Playwright`.
- Esta base está enfocada al MVP; no agrega reseñas, favoritos, pedidos, pagos ni features fuera de alcance.
