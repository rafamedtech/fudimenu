## Stack lock
- Next.js 15 App Router
- React 19 RC
- Prisma 7 + Postgres (Supabase)
- Supabase Auth (magic link + Google)
- Cloudinary (imágenes)
- Stripe (pagos: card + OXXO + SPEI)
- PostHog (analytics) + Sentry (errors)
- Upstash Redis (rate limit)
- Tailwind + shadcn-style components
- TanStack Query + Zustand + RHF + Zod

## Comandos
- `pnpm dev` — desarrollo (USE_MOCKS=true por default si no hay DB)
- `pnpm typecheck` — TypeScript strict
- `pnpm lint` — ESLint + custom rules
- `pnpm test --run` — Vitest unit
- `pnpm test:e2e` — Playwright
- `pnpm db:migrate:dev` — Prisma dev migration
- `pnpm db:push` — push schema sin migration
- `pnpm analyze` — bundle analyzer

## Decisiones lockeadas (no negociar sin razón)
1. USE_MOCKS=true como default en dev — evita acoplar a Supabase
2. Repository pattern con singleton mock — F1-05
3. Server Actions para mutaciones admin (no REST público)
4. Edge runtime + ISR 60s en /m/[slug] — promesa <1s LCP
5. CSP con nonce per request — F3-01
6. Rate limit en endpoints sensibles via Upstash — F1-04
7. Stripe webhook idempotente vía tabla webhookEvent — F1-03

## Convenciones código
- TypeScript strict, no any sin justificación
- Server Actions: return { ok: true | false, ... } en vez de redirect (UI decide)
- Queries Prisma: SIEMPRE con tenantId en where (custom ESLint rule lo enforce)
- Bypass eslint solo en bootstrap (require-auth) o crons documentados
- Imports: alias @/* solo desde src/
- Naming: snake_case en DB, camelCase en JS, kebab-case en archivos
- React: prefer Server Components, 'use client' solo si interactividad

## Multi-tenant security
- TODA query Prisma debe filtrar por tenantId derivado de requireAuth()
- requireAuth resuelve tenant activo vía ACTIVE_TENANT_COOKIE
- Si cookie no matchea memberships → audit log + cae a primer membership
- RLS en Postgres como segunda capa (policies en migrations)

## Env vars críticas
- DATABASE_URL, DIRECT_URL — Postgres
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PRICE_PRO, NEXT_PUBLIC_STRIPE_PRICE_BUSINESS
- CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- RESEND_API_KEY
- NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
- SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- CRON_SECRET — protege endpoints /api/cron/*
- USE_MOCKS — true en dev sin DB

## Bundle baseline (a la fecha)
- TODO: completar tras F4-06

## Runbook ops
- Spike traffic → Vercel auto-scale, monitor Supabase pool size
- Stripe webhook caído → reintentar manualmente desde dashboard, idempotency cubre
- Failed payment user → email automático, grace 7d antes de downgrade
- DB migration prod → siempre via `prisma migrate deploy`, nunca `db push`
- Backup → Supabase PITR 7d (Pro plan)

## Roadmap actual
- F1 Stop the Bleed: ✅ Done (sprint 1)
- F2 UX: ✅ Done (sprint 2)
- F3 Seguridad: ✅ Done (sprint 3)
- F4 Deuda técnica: 🔄 In progress (sprint 4)
- Beta cerrada: 20 tenants, semana 5-10
- Beta pública: waitlist semana 10+
- GA: semana 14

## Tests cobertura
- Unit: services, validators, sanitize, ratelimit, whatsapp, billing, repository
- E2E: onboarding, item-edit, stock-toggle, tenant-isolation, billing
- Lighthouse CI: comensal LCP <1s, perf >90

## TODO conocido (low priority)
- Cloudinary signed upload UI en editor (placeholder actual)
- Logo upload en /settings/brand
- Color picker en /settings/brand
- Multi-sucursal feature (schema listo, UI pending)
- POS sync (v1 roadmap)
- App nativa iOS/Android (post mes 12)