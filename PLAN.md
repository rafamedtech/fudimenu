# Plan.md - Auditoria MVP FudiMenu

Fecha: 2026-05-09  
Base auditada: estado actual del repo contra `MVP.md`  
Modo de auditoria: solo lectura del proyecto. No se ejecutaron tests/build ni comandos que escriban cache. Este archivo es el unico artefacto modificado.

## Veredicto

Estado: **MVP NOT READY**.

El proyecto esta avanzado y varias piezas criticas ya existen, pero aun no debe declararse listo para beta cerrada porque quedan riesgos en performance publica, RLS/migraciones, billing, validacion externa de servicios, E2E con DB disposable y ops/legal.

## Hallazgos Criticos

1. **Performance publica no cerrada**
   - `MVP.md` pide `/m/[slug]` con LCP <1.5s y First Load JS <100kb.
   - La vista publica tiene tracking diferido, pero aun requiere verificacion real con Lighthouse/WebPageTest.
   - Hay dos configs Lighthouse: `lighthouserc.json` y `.lighthouserc.js`, con URLs y thresholds distintos. Esto puede hacer que CI mida algo distinto a lo esperado.

2. **RLS incompleto**
   - `prisma/migrations/007_mvp_schema_hardening/migration.sql` habilita RLS en varias tablas.
   - La migracion solo define policies completas para tenants, memberships, sections, categories e items.
   - Quedan tablas con RLS habilitado y sin policy explicita: `item_translations`, `slug_history`, `menu_views`, `item_views`, `audit_log`, `webhook_events`, `account_delete_requests`.

3. **Billing requiere cierre de produccion**
   - `src/server/actions/billing.actions.ts` ya intenta usar Price IDs mensuales/anuales, pero `src/lib/env.ts` no valida `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_ANNUAL`.
   - `src/server/services/billing.service.ts` sigue usando `STRIPE_PRICE_PRO` para trial.
   - Hay que definir una estrategia unica de precios: monthly/annual por plan + trial Pro.

4. **Variables de entorno incompletas/inconsistentes**
   - `.env.example` no incluye `CRON_SECRET`, aunque cron routes lo requieren.
   - `env.ts` tiene variables legacy (`STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `CLOUDINARY_UPLOAD_PRESET`) y no valida todas las nuevas variables usadas por billing.

5. **E2E peligroso sin DB disposable**
   - `tests/e2e/global-setup.ts` ejecuta `pnpm db:push --force-reset` y `pnpm db:seed`.
   - `pnpm test:e2e` no debe correrse contra staging/produccion ni contra una DB compartida.

6. **Scope creep en plan Business**
   - `src/config/plans.ts` marca `modifiers: true` para Business y la UI muestra "Modificadores", pero `MVP.md` los declara fuera de scope.

7. **Validacion externa pendiente**
   - Supabase Auth/Google, Resend, Stripe CLI/webhooks, Cloudinary real, PostHog, Sentry, Upstash, Vercel deploy, PITR, status page y legal review no pueden darse por cerrados solo leyendo codigo.

## Sesiones De Correccion

Cada sesion esta pensada para abrirse como una conversacion separada en Codex/Claude. El nombre de sesion sirve para identificar el trabajo y evitar mezclar cambios.

---

## Sesion 01 - Baseline, Env Vars Y Gates

**Nombre de la sesion:** `mvp-01-baseline-env-gates`

**Objetivo:** dejar el entorno verificable, alinear variables y evitar que CI/E2E corran contra datos incorrectos.

**Archivos a modificar:**
- `.env.example`
- `src/lib/env.ts`
- `README.md`
- `CLAUDE.md`
- `package.json` si hace falta agregar scripts seguros
- `tests/e2e/global-setup.ts` si hace falta agregar guardas anti-produccion

**Prompt para Codex/Claude:**
```text
Trabaja solo en baseline/env/gates. Alinea .env.example y src/lib/env.ts con las variables realmente usadas por el MVP: Supabase, Stripe monthly/annual Price IDs, Stripe trial Price ID, Cloudinary signed upload, Resend, PostHog, Sentry, Upstash, CRON_SECRET, NEXT_PUBLIC_APP_URL y USE_MOCKS. Agrega guardas para que pnpm test:e2e falle si DATABASE_URL parece produccion/staging compartido. Documenta comandos seguros en README/CLAUDE. No cambies funcionalidades de producto.
```

**Comandos que debe correr el usuario:**
```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

**Informacion que debes proporcionar:**
- `DATABASE_URL` de desarrollo local o test.
- `DIRECT_URL` de desarrollo local o test.
- `NEXT_PUBLIC_APP_URL` local, staging y produccion.
- Confirmar si se mantendra `USE_MOCKS=true` solo en local.
- Confirmar nombres finales de Stripe Price IDs.

---

## Sesion 02 - RLS, Migraciones Y Tenant Isolation

**Nombre de la sesion:** `mvp-02-rls-tenant-isolation`

**Objetivo:** cerrar defensa en profundidad sin romper Prisma/Server Actions.

**Archivos a modificar:**
- `prisma/schema.prisma`
- `prisma/migrations/007_mvp_schema_hardening/migration.sql` o una nueva migracion
- `src/server/repositories/prisma-menu.repository.ts`
- `src/server/services/menu.service.ts`
- `src/server/guards/require-auth.ts`
- `tests/unit/repository-isolation.test.ts`
- `tests/e2e/tenant-isolation.spec.ts`

**Prompt para Codex/Claude:**
```text
Audita tenant isolation y RLS contra MVP.md. Completa policies para todas las tablas con RLS habilitado: item_translations, slug_history, menu_views, item_views, audit_log, webhook_events y account_delete_requests. Verifica que Prisma server-side siempre filtre tenantId y deletedAt donde aplique. Agrega tests unitarios/e2e de aislamiento. No uses service-role bypass para ocultar problemas de aislamiento salvo donde sea estrictamente necesario y documentado.
```

**Comandos que debe correr el usuario:**
```bash
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test --run tests/unit/repository-isolation.test.ts
pnpm test --run tests/unit/require-auth.test.ts
```

Para E2E solo con DB disposable:
```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export USE_MOCKS=false
export E2E_TEST_AUTH=true
pnpm test:e2e tests/e2e/tenant-isolation.spec.ts
```

**Informacion que debes proporcionar:**
- Confirmar el rol de Postgres que usa Prisma en produccion.
- Confirmar si la app usa service role, anon/authenticated role o usuario DB dedicado.
- URL de una DB disposable para probar RLS.

---

## Sesion 03 - Auth, Login Y Onboarding

**Nombre de la sesion:** `mvp-03-auth-onboarding`

**Objetivo:** cerrar F1 con Supabase real, redirects correctos y onboarding maximo 2 pasos.

**Archivos a modificar:**
- `src/app/(auth)/login/page.tsx`
- `src/server/actions/auth.actions.ts`
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`
- `src/app/onboarding/page.tsx`
- `src/server/actions/onboarding.actions.ts`
- `src/server/services/tenant.service.ts`
- `src/hooks/use-auth-broadcast.ts`
- `tests/unit/auth-actions.test.ts`
- `tests/unit/auth-callback.test.ts`
- `tests/e2e/onboarding.spec.ts`

**Prompt para Codex/Claude:**
```text
Cierra F1 Auth + Onboarding contra MVP.md. Verifica /login sin sesion, email Zod, magic link con next, callback, cookie session, BroadcastChannel, polling fallback, Google OAuth, redirect de usuario sin tenant a /onboarding, onboarding maximo 2 pasos, tenant + seccion Menu + categorias por cuisine + item opcional, modal de tenant existente, ACTIVE_TENANT_COOKIE, logout a /login y limpieza de fudi:branch. Agrega tests faltantes sin ampliar scope.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/auth-actions.test.ts tests/unit/auth-callback.test.ts tests/unit/onboarding-actions.test.ts
pnpm typecheck
pnpm lint
```

E2E con DB disposable:
```bash
export USE_MOCKS=false
export E2E_TEST_AUTH=true
pnpm test:e2e tests/e2e/onboarding.spec.ts
```

**Informacion que debes proporcionar:**
- Supabase project URL.
- Supabase anon key.
- Supabase service role key.
- Google OAuth client ID/secret.
- Redirect URLs permitidas en Supabase para local, preview y produccion.
- Dominio/email real para probar magic link.

---

## Sesion 04 - Editor Menu, Secciones, Categorias, Items Y Stock

**Nombre de la sesion:** `mvp-04-menu-editor-stock`

**Objetivo:** cerrar F2 y F3 en mobile-first.

**Archivos a modificar:**
- `src/app/(admin)/menu/page.tsx`
- `src/app/(admin)/menu/s/[id]/page.tsx`
- `src/app/(admin)/menu/[id]/page.tsx`
- `src/app/(admin)/menu/sections/new/page.tsx`
- `src/app/(admin)/menu/sections/[id]/edit/page.tsx`
- `src/app/(admin)/menu/categories/new/page.tsx`
- `src/app/(admin)/menu/categories/[id]/edit/page.tsx`
- `src/components/admin/section-grid.tsx`
- `src/components/admin/section-editor-form.tsx`
- `src/components/admin/section-category-list.tsx`
- `src/components/admin/category-editor-form.tsx`
- `src/components/admin/item-editor-form.tsx`
- `src/components/admin/stock-toggle.tsx`
- `src/server/actions/sections.actions.ts`
- `src/server/actions/categories.actions.ts`
- `src/server/actions/items.actions.ts`
- `tests/e2e/sections.spec.ts`
- `tests/e2e/item-edit.spec.ts`
- `tests/e2e/stock-toggle.spec.ts`

**Prompt para Codex/Claude:**
```text
Cierra F2/F3 contra MVP.md en admin mobile. Verifica grid 2-col en /menu, cards 4/5, skeleton 4 cards, Nueva seccion al final, welcome=1, limites Free, crear/editar/eliminar secciones, detalle /menu/s/[sectionId], CRUD categorias, delete categoria dejando items con categoryId=null, reorder secciones/categorias con @dnd-kit mobile y rollback, editor item con sectionId, selector de categorias por seccion, contador descripcion, upload imagen, specialPrice, stock toggle separado, soft delete con Deshacer 5s, sanitize server-side y tracking item_created/item_edited/stock_toggled.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/sections-actions.test.ts tests/unit/items-actions.test.ts tests/unit/sanitize.test.ts
pnpm typecheck
pnpm lint
```

E2E con DB disposable:
```bash
export USE_MOCKS=false
export E2E_TEST_AUTH=true
pnpm test:e2e tests/e2e/sections.spec.ts tests/e2e/item-edit.spec.ts tests/e2e/stock-toggle.spec.ts
```

**Informacion que debes proporcionar:**
- Limites finales Free/Pro/Business si cambian respecto a `src/config/plans.ts`.
- Confirmar si Business debe ocultar "modificadores" hasta post-MVP.
- Imagenes reales para probar item/section cover o credenciales Cloudinary.

---

## Sesion 05 - Vista Publica, Performance, Analytics Publico

**Nombre de la sesion:** `mvp-05-public-menu-performance`

**Objetivo:** cerrar F5 y los budgets de performance.

**Archivos a modificar:**
- `src/app/(public)/m/[slug]/page.tsx`
- `src/app/(public)/m/[slug]/public-menu-pwa-wrapper.tsx`
- `src/components/public/public-menu-tracking.tsx`
- `src/components/public/cookie-consent.tsx`
- `src/components/public/cookie-consent-context.tsx`
- `src/app/api/track/view/route.ts`
- `src/lib/analytics/events.ts`
- `src/lib/mock/data.ts`
- `prisma/seed.ts`
- `lighthouserc.json`
- `.lighthouserc.js`
- `.github/workflows/lighthouse.yml`
- `tests/e2e/public-menu-smoke.spec.ts`
- `tests/unit/track-view-ua.test.ts`

**Prompt para Codex/Claude:**
```text
Cierra F5 Public Menu contra MVP.md. Reduce JS inicial de /m/[slug] hacia <100kb, elimina client components no esenciales, mantiene core browse sin JS, valida RSC+ISR revalidate=60, documenta runtime Node si Prisma impide Edge, asegura footer Free con link a landing, item_viewed sin duplicados, menu_viewed con IP anonimizada y UA reducido, cookie consent opt-out, PWA prompt segunda visita y HTML semantico. Unifica lighthouserc.json/.lighthouserc.js para que CI mida /m/taqueria-don-pepe y /menu con los thresholds del MVP.
```

**Comandos que debe correr el usuario:**
```bash
pnpm typecheck
pnpm lint
pnpm test --run tests/unit/track-view-ua.test.ts
pnpm build
ANALYZE=true pnpm build
npx -y @lhci/cli@0.13.x autorun
```

**Informacion que debes proporcionar:**
- URL publica final (`NEXT_PUBLIC_APP_URL`).
- Slug demo que debe existir en seed: por defecto `taqueria-don-pepe`.
- Criterio final si el budget `<100kb` es obligatorio o si se acepta excepcion documentada.
- PostHog key/host para validar eventos reales.

---

## Sesion 06 - QR, Slug, Share Y Rate Limits

**Nombre de la sesion:** `mvp-06-qr-slug-share`

**Objetivo:** cerrar F4 completo.

**Archivos a modificar:**
- `src/server/services/slug.service.ts`
- `src/app/api/slug-check/route.ts`
- `src/app/api/qr/[slug]/route.ts`
- `src/app/(admin)/qr/page.tsx`
- `src/app/(admin)/qr/actions.ts`
- `src/app/(admin)/qr/qr-share-actions.tsx`
- `src/components/admin/brand-settings-form.tsx`
- `src/app/(admin)/settings/brand/brand-slug-input.tsx`
- `tests/unit/slug-service.test.ts`
- `tests/unit/ratelimit.test.ts`

**Prompt para Codex/Claude:**
```text
Cierra F4 QR + Slug contra MVP.md. Valida slug unico con regex, min/max, blocklist, debounce de disponibilidad, sugerencias si tomado, slug_history con redirect 301 por 30 dias, QR PNG 600x600 con margin 2 y error correction H, download=1 con Content-Disposition, Cache-Control immutable, rate limit 30/min IP+slug, URL basada en NEXT_PUBLIC_APP_URL, botones copiar/compartir/PNG/PDF y tracking qr_downloaded format png/pdf.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/slug-service.test.ts tests/unit/ratelimit.test.ts
pnpm typecheck
pnpm lint
```

Manual:
```bash
curl -I "http://localhost:3000/api/qr/taqueria-don-pepe?download=1"
```

**Informacion que debes proporcionar:**
- Blocklist definitiva de slugs reservados.
- Dominio final de produccion.
- Slugs existentes que deben preservarse con redirect.

---

## Sesion 07 - Tema, Cloudinary, i18n Y WhatsApp

**Nombre de la sesion:** `mvp-07-theme-cloudinary-i18n-whatsapp`

**Objetivo:** cerrar F6, F7 y F8.

**Archivos a modificar:**
- `src/app/api/uploads/cloudinary/route.ts`
- `src/components/admin/image-upload-field.tsx`
- `src/components/admin/brand-settings-form.tsx`
- `src/app/(admin)/settings/brand/page.tsx`
- `src/app/(admin)/settings/contact/page.tsx`
- `src/server/actions/tenant.actions.ts`
- `src/lib/whatsapp.ts`
- `src/i18n/config.ts`
- `src/i18n/request.ts`
- `src/i18n/messages/es.json`
- `src/i18n/messages/en.json`
- `src/app/(public)/m/[slug]/page.tsx`
- `tests/unit/cloudinary-upload.test.ts`
- `tests/unit/whatsapp.test.ts`

**Prompt para Codex/Claude:**
```text
Cierra F6/F7/F8 contra MVP.md. Valida Cloudinary signed upload para logo, item image y section cover <=5MB jpg/png/webp/heic, alinea env sin upload preset si no se usa, preview live de marca, revalidacion publica tras save, whatsappPhone E.164 multi-pais, mensaje WhatsApp ES/EN con restaurante/item/precio/URL, ocultar boton sin telefono o agotado, next-intl completo, prioridad ?lang > cookie > Accept-Language > es, NEXT_LOCALE 1 ano, errores/toasts traducidos y precio con Intl.NumberFormat.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/cloudinary-upload.test.ts tests/unit/whatsapp.test.ts
pnpm typecheck
pnpm lint
```

Manual:
```bash
pnpm dev
```
Probar upload real en `/settings/brand`, `/menu/sections/new` y `/menu/new`.

**Informacion que debes proporcionar:**
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- `CLOUDINARY_API_KEY`.
- `CLOUDINARY_API_SECRET`.
- Folder/naming deseado para uploads.
- Numeros WhatsApp E.164 reales para prueba.
- Textos finales ES/EN si marketing/legal requiere copy especifico.

---

## Sesion 08 - Billing, Stripe, Trial Y Plan Limits

**Nombre de la sesion:** `mvp-08-billing-stripe-production`

**Objetivo:** cerrar F10 sin promesas incorrectas sobre OXXO/SPEI.

**Archivos a modificar:**
- `src/server/actions/billing.actions.ts`
- `src/server/services/billing.service.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/(admin)/settings/billing/page.tsx`
- `src/app/(admin)/settings/billing/billing-plans.tsx`
- `src/config/plans.ts`
- `src/lib/env.ts`
- `.env.example`
- `tests/unit/billing-actions.test.ts`
- `tests/unit/billing-service.test.ts`
- `tests/unit/stripe-webhook.test.ts`
- `tests/e2e/billing.spec.ts`

**Prompt para Codex/Claude:**
```text
Cierra F10 Billing contra MVP.md. Define variables Stripe Price ID mensuales/anuales por plan y trial Pro. Elimina inconsistencias legacy o documentalas. Checkout card debe usar subscription mode con Price IDs; OXXO/SPEI deben usar payment mode y copy de pago unico/manual sin prometer suscripcion recurrente. Customer Portal solo para clientes Stripe con customer/subscription. Webhook debe verificar firma, ser idempotente, manejar checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed, OXXO/SPEI solo paid, actualizar tenant.plan, persistir stripeCustomerId/stripeSubscriptionId, auditar plan.upgraded/plan.downgraded y mandar email failed payment.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/billing-actions.test.ts tests/unit/billing-service.test.ts tests/unit/stripe-webhook.test.ts
pnpm typecheck
pnpm lint
```

Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

E2E con DB disposable:
```bash
export USE_MOCKS=false
export E2E_TEST_AUTH=true
export E2E_STRIPE_CHECKOUT_MOCK=true
export STRIPE_SECRET_KEY="sk_test_..."
pnpm test:e2e tests/e2e/billing.spec.ts
```

**Informacion que debes proporcionar:**
- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- `STRIPE_PRICE_PRO_MONTHLY`.
- `STRIPE_PRICE_PRO_ANNUAL`.
- `STRIPE_PRICE_BUSINESS_MONTHLY`.
- `STRIPE_PRICE_BUSINESS_ANNUAL`.
- Price ID de trial Pro si se mantiene separado.
- Confirmar duracion y reglas de OXXO/SPEI manual: mensual, anual o prepago.
- Configuracion de Billing Portal en Stripe Dashboard.
- `RESEND_API_KEY` y remitente verificado para failed payment.

---

## Sesion 09 - Especiales, Dashboard Y Scope MVP

**Nombre de la sesion:** `mvp-09-specials-dashboard-scope`

**Objetivo:** cerrar F9 y eliminar scope fuera de MVP en UI/copy.

**Archivos a modificar:**
- `src/app/(admin)/dashboard/page.tsx`
- `src/server/actions/items.actions.ts`
- `src/server/services/menu.service.ts`
- `src/lib/specials-time.ts`
- `src/config/plans.ts`
- `src/app/(admin)/settings/billing/billing-plans.tsx`
- `src/app/api/cron/daily-special-nudge/route.ts`
- `tests/unit/specials-time.test.ts`
- `tests/unit/items-actions.test.ts`

**Prompt para Codex/Claude:**
```text
Cierra F9 Specials y limpia scope. Verifica isSpecialToday, specialPrice, dashboard "Especial de hoy", activar/quitar especial desde dashboard, vista publica con badge y seccion top, uso de specialPrice, enforcement por plan, timezone correcto y cron opcional. Remueve de UI/copy cualquier promesa fuera de MVP como modificadores o multi-sucursal completa; Business puede decir "multi-sucursal futuro" solo si queda claramente diferido.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/specials-time.test.ts tests/unit/items-actions.test.ts
pnpm typecheck
pnpm lint
```

**Informacion que debes proporcionar:**
- Timezone operativo principal.
- Si Specials sera Pro+ o tambien Free durante beta.
- Copy comercial final de planes.

---

## Sesion 10 - Privacidad, Seguridad, Observabilidad Y Legal

**Nombre de la sesion:** `mvp-10-privacy-security-observability`

**Objetivo:** cerrar 11.3, 11.4, 11.5 y 11.6 de `MVP.md`.

**Archivos a modificar:**
- `src/middleware.ts`
- `sentry.server.config.ts`
- `sentry.client.config.ts`
- `sentry.edge.config.ts`
- `src/lib/analytics/events.ts`
- `src/lib/posthog-server.ts`
- `src/components/public/cookie-consent.tsx`
- `src/app/api/account/export/route.ts`
- `src/app/api/account/delete/request/route.ts`
- `src/app/api/account/delete/route.ts`
- `src/app/api/cron/cleanup/route.ts`
- `src/app/api/cron/audit-log-retention/route.ts`
- `src/app/(public)/legal/privacy/page.tsx`
- `src/app/(public)/legal/terms/page.tsx`
- `src/app/(public)/legal/dpa/page.tsx`
- `tests/unit/account-delete-otp.test.ts`
- `tests/unit/audit-log-retention.test.ts`
- `tests/e2e/privacy.spec.ts`

**Prompt para Codex/Claude:**
```text
Cierra privacidad, seguridad y observabilidad contra MVP.md. Verifica headers y CSP con nonce, rate limits sensibles, Sentry beforeSend sin email/IP y tags tenant_id/plan/role, PostHog consent gate y eventos faltantes, export JSON, delete account con OTP, hard delete cron 30d, audit retention 90d, legal pages publicadas y marcadas como pendiente de revision legal externa si no hay abogado. Agrega tests faltantes sin tocar billing/editor.
```

**Comandos que debe correr el usuario:**
```bash
pnpm test --run tests/unit/account-delete-otp.test.ts tests/unit/audit-log-retention.test.ts
pnpm typecheck
pnpm lint
```

E2E con DB disposable:
```bash
export USE_MOCKS=false
export E2E_TEST_AUTH=true
pnpm test:e2e tests/e2e/privacy.spec.ts
```

**Informacion que debes proporcionar:**
- `SENTRY_DSN`.
- `NEXT_PUBLIC_SENTRY_DSN`.
- `NEXT_PUBLIC_POSTHOG_KEY`.
- `NEXT_PUBLIC_POSTHOG_HOST`.
- `UPSTASH_REDIS_REST_URL`.
- `UPSTASH_REDIS_REST_TOKEN`.
- `CRON_SECRET`.
- Confirmacion legal: abogado reviso o debe decir "pendiente de revision legal externa".
- Canal de alertas: Slack/email.

---

## Sesion 11 - CI/CD, Deploy, Backups Y Runbook

**Nombre de la sesion:** `mvp-11-cicd-deploy-ops`

**Objetivo:** cerrar deployment readiness.

**Archivos a modificar:**
- `.github/workflows/ci.yml`
- `.github/workflows/lighthouse.yml`
- `vercel.json`
- `README.md`
- `CLAUDE.md`
- `lighthouserc.json`
- `.lighthouserc.js`
- Documentacion nueva si aplica: `docs/ops-runbook.md`

**Prompt para Codex/Claude:**
```text
Cierra CI/CD y ops contra MVP.md. Unifica configuracion Lighthouse en un solo archivo, asegura CI PR con install frozen, db generate, typecheck, lint, unit, build y E2E contra Postgres disposable. Asegura migrate deploy antes de build/start donde aplique. Documenta Vercel preview/prod, variables por ambiente, rollback, Supabase PITR 7d, restore drill, status page, Sentry alerts y checklist manual de lanzamiento.
```

**Comandos que debe correr el usuario:**
```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

CI/E2E local con DB disposable:
```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export USE_MOCKS=false
export E2E_TEST_AUTH=true
export E2E_STRIPE_CHECKOUT_MOCK=true
export STRIPE_SECRET_KEY="sk_test_..."
pnpm test:e2e
```

Deploy:
```bash
pnpm db:migrate
pnpm build
```

**Informacion que debes proporcionar:**
- Vercel project y ambientes.
- Secrets de GitHub Actions.
- Supabase PITR activo/inactivo.
- Proveedor de status page: Better Stack o Instatus.
- Canal Slack/email para P0.
- Politica de rollback.

## Comandos Globales De Auditoria Final

Ejecutar al final, en este orden.

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

E2E solo con DB disposable:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fudimenu_test?schema=public"
export DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/fudimenu_test?schema=public"
export USE_MOCKS=false
export E2E_TEST_AUTH=true
export E2E_STRIPE_CHECKOUT_MOCK=true
export STRIPE_SECRET_KEY="sk_test_..."
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3102"
pnpm test:e2e
```

Lighthouse:

```bash
pnpm build
pnpm start
npx -y @lhci/cli@0.13.x autorun
```

Stripe:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

## Variables E Informacion Externa Requerida

### Supabase

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Google OAuth client ID/secret
- Redirect URLs por ambiente
- Confirmacion de PITR/backups
- Confirmacion de RLS aplicado en DB real

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_BUSINESS_MONTHLY`
- `STRIPE_PRICE_BUSINESS_ANNUAL`
- Price ID trial Pro si aplica
- Billing Portal configurado
- Politica final para OXXO/SPEI manual

### Cloudinary

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- Folder/naming final
- Confirmar si `CLOUDINARY_UPLOAD_PRESET` se elimina o se mantiene para otro flujo

### Email

- `RESEND_API_KEY`
- Dominio verificado
- From address final
- Templates/copy para failed payment, delete OTP y emails criticos

### Analytics / Observability

- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- Alertas Sentry/PostHog/Slack

### App / Deploy

- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`
- Vercel project/envs
- Secrets GitHub Actions
- Dominio final
- Status page
- Runbook rollback

### Legal / Operacion

- Politica de privacidad revisada o pendiente.
- ToS revisado o pendiente.
- DPA revisado o pendiente.
- RFC/datos fiscales si se facturara en MX.
- Responsable operativo de incidentes.

## Checklist Para Declarar MVP Ready

- `pnpm typecheck` pasa.
- `pnpm lint` pasa con regla custom activa.
- `pnpm test --run` pasa.
- `pnpm build` pasa.
- `pnpm test:e2e` pasa contra DB disposable.
- Lighthouse mobile pasa en `/m/taqueria-don-pepe` y `/menu`.
- `/m/[slug]` cumple LCP <1.5s y bundle objetivo o excepcion firmada.
- Supabase magic link y Google OAuth funcionan en produccion.
- Onboarding crea tenant, seccion Menu, categorias e item opcional.
- Editor permite seccion -> categoria -> item -> stock -> vista publica.
- QR PNG/PDF, copy y share funcionan.
- WhatsApp abre con mensaje correcto.
- Stripe card subscription funciona.
- OXXO/SPEI queda como pago manual/prepago sin prometer subscription.
- Webhooks actualizan plan y audit log.
- Export/delete account funcionan con OTP.
- RLS aplicado y tenant isolation validado.
- Sentry/PostHog sin PII sensible.
- PITR/backups/status/rollback documentados.
- Legal pages revisadas o marcadas como pendientes de revision externa.

