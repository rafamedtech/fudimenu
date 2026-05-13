# FudiMenu — Starter

Mobile-first menú digital para restauranteros. Reemplaza PDFs en Drive con menú editable + QR fijo.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind + shadcn-style components
- Supabase (Auth + Postgres + RLS)
- Prisma ORM
- TanStack Query (server state) + Zustand (UI state)
- React Hook Form + Zod
- Cloudinary (imágenes)
- Stripe (pagos)
- PostHog (analytics) + Sentry (errors)
- Vercel (hosting + edge)

## Setup

```bash
pnpm install
cp .env.example .env.local
# llena vars o deja USE_MOCKS=true para arrancar sin backend
pnpm dev
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test --run   # unit tests only: tests/unit/**/*.test.ts
pnpm build
```

Abre:
- http://localhost:3000 — landing
- http://localhost:3000/m/taqueria-don-pepe — vista comensal demo con menú Marenca
- http://localhost:3000/onboarding — wizard
- http://localhost:3000/dashboard — admin (mockeado)

## Supabase DB

Para usar la base real:

```bash
cp .env.example .env
# llena DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
# cambia USE_MOCKS=false
pnpm db:generate
pnpm db:migrate
pnpm dev
```

`DIRECT_URL` es la conexión directa de Supabase que usa Prisma CLI para migraciones. `DATABASE_URL` es la conexión que usa Prisma Client en runtime; puede ser la URL pooled de Supavisor o la misma directa durante desarrollo. La app sigue usando `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Supabase Auth/SSR.

La vista pública demo `/m/taqueria-don-pepe` usa el menú Marenca desde `src/lib/mock/data.ts` en modo mock; el admin, onboarding y `/api/items` usan Prisma contra Supabase Postgres cuando `USE_MOCKS=false`.

## E2E tests

> **Advertencia:** `pnpm test:e2e` ejecuta `db:push --force-reset` que **borra todos los datos** de la base apuntada por `DATABASE_URL`.

Usar siempre un proyecto Supabase dedicado para tests. El setup detecta automáticamente si `DATABASE_URL` parece producción (no contiene `localhost`, `127.0.0.1`, `local`, `test` o `ci`) y falla antes de tocar datos.

```bash
# Correr solo unit tests (seguro con cualquier entorno):
pnpm test --run

# Correr E2E (requiere DATABASE_URL de proyecto test):
DATABASE_URL="postgresql://..." pnpm test:e2e
```

## Estructura

```
src/
├── app/
│   ├── (public)/m/[slug]/        # F5 vista comensal — RSC + edge
│   ├── (auth)/login/             # F1 magic link
│   ├── (admin)/                  # F2/F3/F6 gated layout
│   │   ├── dashboard/
│   │   ├── menu/
│   │   ├── menu/[id]/
│   │   ├── onboarding/
│   │   ├── analytics/
│   │   └── settings/
│   ├── api/
│   │   ├── qr/[slug]/            # F4 QR PNG
│   │   └── items/
│   └── auth/callback/            # F1 OAuth
├── components/
│   ├── ui/                       # primitivos: button, input, toggle, sheet, card, skeleton
│   ├── layout/                   # bottom-nav, fab, app-header
│   ├── menu/                     # item-card
│   └── admin/                    # stock-toggle, item-editor-form
├── lib/
│   ├── db/                       # Prisma client singleton
│   ├── supabase/                 # browser/server/middleware clients para Auth
│   ├── api/                      # fetch wrapper + ApiError
│   ├── validators/               # Zod schemas
│   ├── analytics/                # PostHog wrapper tipado
│   ├── storage/                  # localStorage typed
│   ├── mock/                     # data demo (USE_MOCKS=true)
│   ├── env.ts                    # @t3-oss runtime validation
│   └── utils.ts                  # cn, formatPrice, slugify
├── hooks/                        # use-items con optimistic updates
├── stores/                       # ui.store, branch.store (Zustand)
├── server/
│   ├── actions/                  # Server Actions (mutations)
│   ├── services/                 # menu.service (DB layer)
│   └── guards/                   # require-auth
├── types/domain.ts
├── i18n/messages/                # F7 ES/EN
└── middleware.ts                 # auth gate
```

## Features mapping

| Feature | Archivos clave |
|---|---|
| F1 Auth + onboarding | `app/(auth)/login`, `app/auth/callback`, `app/(admin)/onboarding`, `server/actions/auth.actions.ts` |
| F2 Editor menú | `app/(admin)/menu`, `components/admin/item-editor-form.tsx`, `server/actions/items.actions.ts` |
| F3 Toggle agotado | `components/admin/stock-toggle.tsx`, `hooks/use-items.ts` (optimistic) |
| F4 Link + QR | `app/api/qr/[slug]/route.ts`, `app/(public)/m/[slug]` |
| F5 Vista comensal | `app/(public)/m/[slug]/page.tsx` (edge + ISR 60s) |
| F6 Tema básico | `app/(admin)/settings`, color en page público |
| F7 i18n ES/EN | `i18n/messages/*.json`, `?lang=` en URL pública |

## State

| Tipo | Tech | Dónde |
|---|---|---|
| Server state | TanStack Query | `hooks/use-items.ts` |
| UI ephemeral | Zustand | `stores/ui.store.ts` |
| URL state | Search params nativos | en cada page |
| Form state | RHF + Zod | `components/admin/item-editor-form.tsx` |
| Persist (branch, locale) | Zustand persist + localStorage | `stores/branch.store.ts`, `lib/storage/local.ts` |

## Auth flow

1. `/login` → magic link via Server Action `signInWithMagicLinkAction`
2. Email → `/auth/callback` → exchange code → cookie httpOnly
3. `middleware.ts` valida sesión y redirige rutas admin
4. `requireAuth()` server-side en cada page admin

## API layer

- **Server Actions** para mutaciones (`server/actions/`)
- **Route Handlers** para públicas (`app/api/qr`, `app/api/items`)
- **`apiFetch`** wrapper con retry + `ApiError` mapping
- **`menuService`** abstrae mock vs Prisma/Postgres real (toggle con `USE_MOCKS`)

## Errores

4 niveles:
1. `app/error.tsx` global
2. `app/(public)/m/[slug]/error.tsx` por segment
3. `ApiError` clase tipada
4. Toasts via `sonner` + `toUserMessage()`

## Analytics

- PostHog inicializado en `Providers`
- Eventos tipados en `lib/analytics/events.ts`
- Server-side eventos críticos (revenue) — pendiente

## Próximos pasos

1. `pnpm install` + setup Supabase project
2. Drizzle schema + migrations (ver PRD)
3. Cloudinary signed upload en editor
4. Stripe + plans en `/settings/billing`
5. PWA service worker
6. E2E Playwright
