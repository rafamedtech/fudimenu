# CLAUDE.md — 12-rule template

These rules apply to every task in this project unless explicitly overridden.
Bias: caution over speed on non-trivial work. Use judgment on trivial tasks.

## Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess.
Present multiple interpretations when ambiguity exists.
Push back when a simpler approach exists.
Stop when confused. Name what's unclear.

## Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative.
No features beyond what was asked. No abstractions for single-use code.
Test: would a senior engineer say this is overcomplicated? If yes, simplify.

## Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess.
Don't "improve" adjacent code, comments, or formatting.
Don't refactor what isn't broken. Match existing style.

## Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified.
Don't follow steps. Define success and iterate.
Strong success criteria let you loop independently.

## Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction.
Do NOT use me for: routing, retries, deterministic transforms.
If code can answer, code answers.

## Rule 6 — Token budgets are not advisory
Per-task: 4,000 tokens. Per-session: 30,000 tokens.
If approaching budget, summarize and start fresh.
Surface the breach. Do not silently overrun.

## Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested).
Explain why. Flag the other for cleanup.
Don't blend conflicting patterns.

## Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities.
"Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

## Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does.
A test that can't fail when business logic changes is wrong.

## Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left.
Don't continue from a state you can't describe back.
If you lose track, stop and restate.

## Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase.
If you genuinely think a convention is harmful, surface it. Don't fork silently.

## Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently.
"Tests pass" is wrong if any were skipped.
Default to surfacing uncertainty, not hiding it.

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
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_PRO — trial 14 días (billing.service.ts)
- STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL — checkout card Pro
- STRIPE_PRICE_BUSINESS_MONTHLY, STRIPE_PRICE_BUSINESS_ANNUAL — checkout card Business
- CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME — signed upload (no preset)
- RESEND_API_KEY
- NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
- SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN
- UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
- CRON_SECRET — protege endpoints /api/cron/*
- NEXT_PUBLIC_APP_URL — URL base (default http://localhost:3000)
- USE_MOCKS — true en dev sin DB

## E2E seguridad
- `pnpm test:e2e` corre `db:push --force-reset` → **borra todos los datos**
- global-setup.ts falla si DATABASE_URL no contiene "localhost", "127.0.0.1", "local", "test" o "ci"
- Usar siempre un proyecto Supabase dedicado para tests, nunca producción/staging

## Bundle baseline (2026-05-11)
- `/m/[slug]` First Load JS: **115 kB gz** (de 138 kB; -23 kB sprint perf)
- `/menu` First Load JS: 226 kB gz
- `/onboarding` First Load JS: 183 kB gz
- Shared baseline (todas rutas): **102 kB gz** = react-dom-client (54.2) + next router+react (45.4). Irreducible en Next 15 + React 19 RC.
- /m/[slug] optimizaciones: strings i18n pasadas como props desde RSC (no `useTranslations` en initial client chunk → quita `intl-messageformat` ~15.6 kB), `<Button>` + lucide reemplazados por `<button>`+SVG inline (quita `tailwind-merge` ~6.5 kB), tracker/cookie-consent vía `next/dynamic` `ssr:false`, PostHog deferred (fuera de root layout).
- Excepción documentada (MVP §11.1): budget <100 kB no viable; gate efectivo = LCP/CLS/INP en `.lighthouserc.cjs`.

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
