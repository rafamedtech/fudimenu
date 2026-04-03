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
- Esta base está enfocada al MVP; no agrega reseñas, favoritos, pedidos, pagos ni features fuera de alcance.
