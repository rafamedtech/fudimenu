# PLAN.md - Auditoria MVP FudiMenu

Fecha de auditoria: 2026-05-12  
Base auditada: `MVP.md` contra el estado actual del repositorio.  
Alcance de esta pasada: se ejecutaron tests/gates disponibles y se reviso cobertura UI/E2E. Solo se modifica este `PLAN.md`.

## Resultado De Tests

- [x] `pnpm test --run` paso: 27 archivos, 200 tests, 0 failed.
- [x] `pnpm typecheck` paso.
- [x] `pnpm lint` paso con ESLint CLI.
- [x] `pnpm build` paso.
- [x] `pnpm exec playwright test --list` paso: 29 tests UI/E2E en 8 archivos.
- [ ] `pnpm test:e2e` no se ejecuto por seguridad: el guard detecto `DATABASE_URL` apuntando a Supabase remoto (`aws-0-us-west-2.pooler.supabase.com`) y bloqueo el `db:push --force-reset`.
- [ ] Lighthouse no se ejecuto: el workflow llama `./.lighthouserc.cjs`, pero ese archivo no existe en el repo.

Nota importante: no se agregaron tests UI nuevos porque ya existe suite Playwright E2E. El bloqueo actual es de entorno, no de ausencia de tests.

## Veredicto

Estado actual: **MVP condicional, no listo para release publico**.

El codigo base pasa unitarios, typecheck, lint y build. El MVP queda bloqueado por:

- [ ] E2E/UI real sin ejecutar por falta de base local/test segura.
- [ ] Lighthouse CI roto por config faltante.
- [ ] Validaciones externas pendientes: Supabase Auth/RLS, Stripe, Cloudinary, PostHog, Sentry, Upstash, Resend y Vercel.
- [ ] QA manual mobile/performance/legal/ops pendiente.

## Checklist MVP Auditado

### F0 - Fundacion

- [x] Next.js App Router y estructura base.
- [x] Prisma/Supabase Postgres.
- [x] Server Actions y repository/service pattern.
- [x] `vitest.config.ts` ejecuta solo `tests/unit/**/*.test.ts` y excluye `.claude/**`, `node_modules/**`, `tests/e2e/**`.
- [x] `pnpm test --run` pasa con 200 tests.
- [x] `pnpm typecheck` pasa.
- [x] `pnpm lint` pasa.
- [x] `pnpm build` pasa.
- [x] CI principal con typecheck, lint, unit, build y E2E con Postgres disposable.
- [ ] E2E local pendiente con DB segura.

### F1 - Auth

- [x] Login por magic link implementado.
- [x] Login con Google OAuth implementado.
- [x] `next` query preservado en callback/login.
- [x] Broadcast/polling cubierto en flujo de auth.
- [x] Logout con redirect y limpieza de tenant activo.
- [x] Middleware redirige admin sin sesion a login.
- [x] Usuario autenticado sin tenant redirige a onboarding.
- [x] Tests unitarios de auth/callback/middleware pasan.
- [ ] Validar en Supabase Dashboard que magic links expiren en 1 hora y sean single-use.
- [ ] Validar Google OAuth con dominio/callback real.

### F2 - Editor De Menu

- [x] Vista `/menu` con secciones, cards, welcome banner, empty/skeleton y CTA.
- [x] Limites Free visibles/enforzados.
- [x] `/menu/new` bloquea plan Free al llegar al limite.
- [x] Crear/editar/eliminar secciones.
- [x] Reordenar secciones con DnD/optimistic rollback.
- [x] Vista de seccion `/menu/s/[sectionId]`.
- [x] CRUD categorias.
- [x] Reordenar categorias con DnD/optimistic rollback.
- [x] CRUD items.
- [x] Selector de categorias del item editor usa chips/radiogroup.
- [x] Stock toggle visible en listas y editor.
- [x] Tracking de item/stock/menu events presente.
- [ ] Flujo completo seccion -> categoria -> item -> vista publica pendiente de validar en E2E real.

### F3 - Stock Toggle

- [x] Toggle visible en card/listas y editor.
- [x] Optimistic update con rollback.
- [x] Haptic feedback via `navigator.vibrate`.
- [x] Revalidate path/tag al cambiar stock.
- [x] Tracking `stock_toggled`.
- [x] Unit coverage relacionada pasa.
- [ ] E2E stock toggle pendiente de correr con DB segura.

### F4 - QR Y Slug

- [x] Slug editable.
- [x] Blocklist/validacion/disponibilidad.
- [x] Historial de slug con redirect.
- [x] QR download/share y tracking.
- [x] Rate limit cubierto por tests unitarios.
- [ ] Validar descarga QR, Web Share API y fallback copy link en iOS/Android.

### F5 - Menu Publico / Performance

- [x] Ruta publica `/m/[slug]`.
- [x] HTML semantico, skip link y navegacion por secciones.
- [x] Items agotados sin WhatsApp visible.
- [x] Tracking `menu_viewed`, `item_viewed`, `whatsapp_clicked`.
- [x] Footer Free presente.
- [x] Runtime/revalidate configurados.
- [x] Build reporta `/m/[slug]` en 115 kB First Load JS.
- [x] Excepcion de bundle <100 kB esta documentada en `MVP.md`.
- [ ] Validar Lighthouse mobile real: LCP <1.5s, INP <200ms, CLS <0.1.
- [ ] Validar accesibilidad manual con teclado/lector basico.

### F6 - Tema, Marca Y Cloudinary

- [x] Endpoint signed upload Cloudinary.
- [x] Validacion de auth/tamano/tipo en tests unitarios.
- [x] Brand settings con uploader/preview/color.
- [x] Section cover e item image soportados.
- [ ] Proveer variables reales Cloudinary.
- [ ] Validar upload real jpg/png/webp/heic menor a 5MB.
- [ ] Confirmar transformaciones, carpeta y permisos en Cloudinary Dashboard.

### F7 - i18n

- [x] Resolucion `?lang` > cookie > Accept-Language > default.
- [x] Cookie `NEXT_LOCALE`.
- [x] Errores/mensajes principales localizados.
- [x] Precios por locale.
- [x] WhatsApp message localizado.
- [ ] Validar manualmente ES/EN en browser con cookie y query param.

### F8 - Onboarding

- [x] Onboarding maximo 2 pasos.
- [x] Seed de seccion/menu/categorias por cuisine.
- [x] Primer item opcional.
- [x] Modal o flujo de tenant existente.
- [x] Redirect final `/menu?welcome=1`.
- [x] Tests E2E de onboarding existen.
- [ ] E2E onboarding pendiente de correr con DB segura.
- [ ] Validar flujo completo con usuario nuevo real en Supabase Auth.

### F9 - Analytics / Observabilidad

- [x] PostHog integrado con consent gate.
- [x] Eventos MVP principales definidos.
- [x] Sentry con scrub PII y tags.
- [x] Audit logs para eventos sensibles.
- [ ] Proveer keys reales PostHog/Sentry.
- [ ] Validar eventos reales en PostHog por flujo completo.
- [ ] Configurar alertas Sentry P0/P1 en dashboard.

### F10 - Billing

- [x] Modelos/campos Stripe customer/subscription en tenant.
- [x] Checkout action y webhook Stripe.
- [x] Billing Portal action.
- [x] UI de plan actual y botones Upgrade/Manage.
- [x] Precios mensual/anual soportados por env vars.
- [x] Card usa subscription mode.
- [x] OXXO/SPEI usa payment mode manual/prepago.
- [x] Webhook maneja checkout/subscription/invoice failed.
- [x] Tests unitarios de billing/webhook pasan.
- [ ] Proveer Price IDs reales de Stripe mensual/anual.
- [ ] Configurar Stripe Billing Portal.
- [ ] Validar checkout real con tarjeta.
- [ ] Validar flujo OXXO/SPEI real como pago manual/prepago.
- [ ] Confirmar decision de producto: `PLAN_CONFIG.business.features.modifiers = true` y `branches = 3`, mientras `MVP.md` marca modificadores/multi-sucursal como OUT en Scope.

### F11 - Privacidad

- [x] Export JSON.
- [x] Delete account con OTP.
- [x] Hard delete cron 30 dias.
- [x] Audit retention 90 dias.
- [x] Legal pages con nota de revision legal pendiente.
- [x] Unit tests de privacidad/retention pasan.
- [ ] Revision legal externa real antes de publicar.
- [ ] Validar cron jobs en Vercel y logs de ejecucion.

### F12 - Seguridad / RLS

- [x] Migraciones RLS activas presentes.
- [x] Tests de tenant isolation unitarios pasan.
- [x] Tests E2E de tenant isolation existen.
- [x] Headers CSP/security en middleware.
- [x] HSTS configurado en produccion via `next.config.ts`.
- [x] Runbook y security docs presentes.
- [ ] E2E tenant isolation pendiente de correr con DB segura.
- [ ] Validar politicas RLS aplicadas en base real/staging.
- [ ] Validar HSTS/CSP en deploy real.
- [ ] Ejecutar secret scan/client bundle scan antes de release.

### F13 - Ops / CI / Performance

- [x] `docs/RUNBOOK.md` documenta envs, deploy, migrate deploy, rollback, PITR, restore drill y monitoreo.
- [x] `docs/SECURITY.md` documenta HSTS, CSP, PII scrub y checklist.
- [x] Workflow CI base presente.
- [x] Workflow Lighthouse presente.
- [ ] Falta `.lighthouserc.cjs`; el workflow Lighthouse fallara mientras no exista.
- [ ] Validar Lighthouse mobile con umbrales MVP.
- [ ] Validar deploy preview/production en Vercel.
- [ ] Confirmar backups/PITR/restore drill en Supabase.

## Pendientes Que Codex Puede Corregir Luego

No dejo prompt para estos porque son cambios de codigo/config que Codex puede implementar directamente cuando autorices modificar algo mas que tests/PLAN:

- [ ] Crear `.lighthouserc.cjs` alineado con `MVP.md` y `.github/workflows/lighthouse.yml`.
- [ ] Alinear `PLAN_CONFIG.business` con la decision final de scope: quitar `modifiers`/multi-sucursal del MVP o documentarlo como promesa "proximamente" sin activar feature flags.
- [ ] Agregar script de test UI local seguro, si quieres correr smoke UI sin DB destructiva. Ejemplo: una config Playwright separada con mocks y sin `globalSetup`.

## Prompts / Sesiones Que Requieren Usuario O Externos

### Sesion: `mvp-e2e-safe-db`

- [ ] Requiere una DB local/test segura.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - `DATABASE_URL` local/test que contenga `localhost`, `127.0.0.1`, `local`, `test` o `ci`.
  - `DIRECT_URL` local/test equivalente.
  - Confirmacion de que la DB puede ser destruida: `pnpm test:e2e` corre `pnpm db:push --force-reset`.

Prompt:

```text
Con DATABASE_URL y DIRECT_URL apuntando a una base local/test desechable, ejecuta la suite Playwright completa. No modifiques codigo. Reporta tests failed/skipped, traces utiles y si los flujos MVP de onboarding, sections, item edit, stock, tenant isolation, billing mock y privacidad pasan.
```

Comandos sugeridos:

```bash
export DATABASE_URL="postgresql://USER:PASS@localhost:5432/fudimenu_test?schema=public"
export DIRECT_URL="$DATABASE_URL"
export USE_MOCKS=false
export E2E_TEST_AUTH=true
export E2E_STRIPE_CHECKOUT_MOCK=true
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3102"
export STRIPE_SECRET_KEY="sk_test_e2e_mock"
pnpm test:e2e
```

### Sesion: `mvp-env-production`

- [ ] Requiere informacion del usuario.
- Archivos a modificar: variables de entorno locales/Vercel, no codigo.
- Informacion necesaria:
  - `NEXT_PUBLIC_APP_URL`
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_PRO_ANNUAL`
  - `STRIPE_PRICE_BUSINESS_MONTHLY`
  - `STRIPE_PRICE_BUSINESS_ANNUAL`
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `CRON_SECRET`

Prompt:

```text
Con las variables reales ya cargadas en .env.local y en Vercel, valida que la app arranque sin mocks. No modifiques codigo. Reporta variables faltantes, servicios que no autentican y cualquier mismatch entre .env.example, src/lib/env.ts y el dashboard correspondiente.
```

Comandos sugeridos:

```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

### Sesion: `mvp-supabase-auth-rls`

- [ ] Requiere acceso al dashboard de Supabase.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - Proyecto Supabase staging/production.
  - URLs autorizadas para Magic Link y OAuth.
  - Google OAuth Client ID/Secret.
  - Base staging con migraciones aplicadas.

Indicaciones:

```text
Valida en Supabase que Magic Link expire en 1 hora, sea single-use, tenga redirect URLs correctas para /auth/callback y que Google OAuth funcione con el dominio final. Verifica en Postgres que las politicas RLS activas coincidan con las migraciones del repo y que un tenant no pueda leer datos de otro tenant usando usuarios reales.
```

Comandos sugeridos:

```bash
pnpm exec prisma migrate deploy
```

### Sesion: `mvp-stripe-live-readiness`

- [ ] Requiere acceso a Stripe Dashboard y Stripe CLI.
- Archivos a modificar: ninguno, salvo variables de entorno si faltan IDs reales.
- Informacion necesaria:
  - Product/Price mensual Pro.
  - Product/Price anual Pro.
  - Product/Price mensual Business.
  - Product/Price anual Business.
  - Customer Portal configurado.
  - Webhook endpoint publico.
  - Politica final de OXXO/SPEI: prepago/manual, no subscription recurrente.

Prompt:

```text
Con Stripe configurado en test mode, valida checkout por tarjeta, Billing Portal, webhook checkout.session.completed, customer.subscription.updated, customer.subscription.deleted e invoice.payment_failed. Valida que OXXO/SPEI no se presenten como suscripcion recurrente. No modifiques codigo; entrega eventos recibidos, estado final del tenant y gaps de configuracion.
```

Comandos sugeridos:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
pnpm test --run tests/unit/stripe-webhook.test.ts tests/unit/billing-actions.test.ts tests/unit/billing-service.test.ts
```

### Sesion: `mvp-cloudinary-upload`

- [ ] Requiere credenciales Cloudinary reales.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - Cloud name.
  - API key.
  - API secret.
  - Folder/preset esperado para uploads de tenant.
  - Imagenes reales de prueba jpg/png/webp/heic menores y mayores a 5MB.

Prompt:

```text
Valida el endpoint signed upload con credenciales reales de Cloudinary para logo, cover de seccion e imagen de item. Prueba jpg/png/webp/heic menor a 5MB, archivo mayor a 5MB y tipo invalido. No modifiques codigo; reporta URL final, transformaciones aplicadas y errores esperados.
```

Comandos sugeridos:

```bash
pnpm test --run tests/unit/cloudinary-upload.test.ts
pnpm dev
```

### Sesion: `mvp-observability-production`

- [ ] Requiere acceso a PostHog, Sentry y logs Vercel.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - Project key PostHog.
  - DSN Sentry.
  - Reglas de alerta P0/P1.
  - Politica de consentimiento analytics.

Prompt:

```text
Ejecuta un flujo real de usuario y valida en PostHog los eventos menu_viewed, item_viewed, whatsapp_clicked, qr_downloaded, item_created, item_edited, stock_toggled, onboarding_completed y plan_upgrade_started. Valida en Sentry que errores capturen tags tenant_id, plan y role sin PII sensible. No modifiques codigo; entrega capturas o IDs de eventos.
```

### Sesion: `mvp-manual-device-qa`

- [ ] Requiere dispositivos o navegadores reales.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - URL de preview/production.
  - Tenant demo.
  - Numero WhatsApp real de prueba.
  - Slug publico de prueba.

Checklist manual:

- [ ] Magic link en mobile.
- [ ] Google OAuth.
- [ ] Onboarding de usuario nuevo.
- [ ] Crear seccion, categoria e item.
- [ ] Reordenar secciones y categorias en touch.
- [ ] Toggle agotado con rollback visible si falla red.
- [ ] Descargar QR.
- [ ] Compartir QR con Web Share API.
- [ ] Fallback copiar link si Web Share API no existe.
- [ ] Abrir menu publico `/m/[slug]`.
- [ ] WhatsApp deep link con mensaje correcto.
- [ ] ES/EN por query, cookie y header.

### Sesion: `mvp-lighthouse-release`

- [ ] Requiere que exista `.lighthouserc.cjs`.
- Archivos a modificar: ninguno en esta sesion.
- Informacion necesaria:
  - URL local o preview.
  - Slug publico demo.
  - Umbrales finales aceptados para LCP/Performance/Accessibility.

Prompt:

```text
Con la configuracion Lighthouse ya presente, ejecuta auditoria mobile para /menu y /m/[slug]. No modifiques codigo; reporta LCP, Performance, Accessibility, Best Practices, SEO y los elementos que bloqueen cumplir el MVP.
```

Comandos sugeridos:

```bash
pnpm build
pnpm start
npx -y @lhci/cli@0.13.x autorun --config=./.lighthouserc.cjs
```

### Sesion: `mvp-privacy-legal-ops`

- [ ] Requiere revision externa/legal y dashboards.
- Archivos a modificar: ninguno.
- Informacion necesaria:
  - Responsable legal.
  - Politica de privacidad final.
  - Terminos finales.
  - Confirmacion de Supabase PITR/backups.
  - Confirmacion de Vercel cron logs.
  - Canal de alertas operacional.

Indicaciones:

```text
Revisar legalmente privacy/terms/cookies antes de launch. Confirmar en Supabase PITR/backups y ejecutar restore drill documentado. Confirmar en Vercel que cron jobs de hard delete y audit retention corren con CRON_SECRET real y generan logs exitosos.
```

Comandos sugeridos:

```bash
pnpm test --run tests/unit/account-delete-otp.test.ts tests/unit/audit-log-retention.test.ts
```

## Orden Recomendado

1. [ ] Crear `.lighthouserc.cjs` y decidir scope final de Business.
2. [ ] Preparar DB local/test segura y ejecutar `pnpm test:e2e`.
3. [ ] Cargar variables reales en `.env.local` y Vercel.
4. [ ] Validar Supabase Auth/RLS.
5. [ ] Validar Stripe completo.
6. [ ] Validar Cloudinary real.
7. [ ] Ejecutar QA manual mobile.
8. [ ] Ejecutar Lighthouse.
9. [ ] Cerrar legal/ops antes de launch.

---

## Gaps Detectados — Auditoría 2026-05-26

> Lectura directa de código fuente contra MVP.md. Cada ítem tiene un prompt listo para copiar. Si requiere datos del usuario, están listados explícitamente.

---

### GAP-1 — Tests unitarios faltantes (`menu-service` y `menu-sections.repository`)

**Quién lo resuelve:** Claude — no requiere input del usuario

**Prompt:**

```text
Crea dos archivos de test unitario en tests/unit/:

1. menu-service.test.ts — cubre menuService.upsertItem, menuService.toggleItemAvailability,
   menuService.softDeleteItem, menuService.restoreItem, menuService.upsertSection,
   menuService.deleteSection, menuService.reorderSections. Usa el mock repository
   (USE_MOCKS=true). Cada test debe encodar el "por qué" importa el comportamiento,
   no solo que retorna algo.

2. menu-sections.repository.test.ts — cubre que PrismaMenuRepository.upsertSection y
   findSections siempre filtran por tenantId. Usa el patrón de mock de Prisma en
   tests/unit/tenant-isolation-prisma.test.ts y repository-isolation.test.ts como guía.

No modifiques código fuera de tests/. Verifica con `pnpm test --run` al final.
```

---

### GAP-2 — Evento `signup` ausente en analytics

**Quién lo resuelve:** Claude — no requiere input del usuario

**Prompt:**

```text
Agrega el evento 'signup' al tipo AnalyticsEvent en src/lib/analytics/events.ts
con props: { method: 'magic_link' | 'google' }.

Luego llama track('signup', { method }) en dos lugares en src/app/(auth)/login/page.tsx:
- Cuando signInWithMagicLinkAction retorna ok:true → track('signup', { method: 'magic_link' })
- Cuando se inicia Google OAuth → track('signup', { method: 'google' })

No modifiques más de lo necesario. Corre `pnpm typecheck` al final.
```

---

### GAP-3 — Variables de entorno críticas marcadas como `.optional()` en producción

**Quién lo resuelve:** Claude — no requiere input del usuario

**Prompt:**

```text
En src/lib/env.ts, crea un helper:

  const requiredInProd = (schema: z.ZodString) =>
    process.env.USE_MOCKS === 'true' ? schema.optional() : schema.min(1, 'Requerida en producción');

Aplica requiredInProd() a: DATABASE_URL, DIRECT_URL, SUPABASE_SERVICE_ROLE_KEY,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY,
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET.

Deja como .optional() las que tienen fallback funcional en mocks:
POSTHOG_*, SENTRY_DSN, CLOUDINARY_*.

Corre `pnpm typecheck` y `pnpm test --run` al final. No modifiques nada más.
```

---

### GAP-4 — Logo upload en `/settings/brand` marcado como TODO en CLAUDE.md

**Quién lo resuelve:** Claude — pero primero necesito que confirmes lo siguiente:

**Necesito que me digas:**
- [ ] ¿Las variables `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` y `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ya están seteadas en producción?

**Prompt (una vez confirmado Cloudinary activo):**

```text
El componente ImageUploadField ya existe en src/components/admin/image-upload-field.tsx
y el endpoint signed upload en src/app/api/uploads/cloudinary/route.ts.

Verifica que BrandSettingsForm en src/components/admin/brand-settings-form.tsx pasa
correctamente kind="logo" a ImageUploadField y que el campo logoUrl se persiste en
updateBrandSettingsFormAction en src/server/actions/tenant.actions.ts.

Si hay algún gap (prop faltante, campo no guardado, validación ausente), corrígelo.
Corre `pnpm typecheck` al final. No crees UI nueva.
```

---

### GAP-5 — Status page público no configurado

**Quién lo resuelve:** Requiere acción del usuario primero

**Necesito que me proporciones:**
- [ ] Cuenta en [Better Stack](https://betterstack.com) o [Instatus](https://instatus.com) (elige uno)
- [ ] URL de producción de FudiMenu a monitorear
- [ ] Email o canal (Slack/email) donde llegan alertas de downtime
- [ ] API key o token de la plataforma elegida

**Prompt (una vez que tengas la cuenta y los datos):**

```text
Configura el status page de FudiMenu:
1. Crea un monitor HTTP GET a {APP_URL} con check cada 1 minuto.
2. Crea un monitor HTTP GET a {APP_URL}/api/qr/taqueria-don-pepe con check cada 5 minutos.
3. Documenta las URLs del status page y los monitores en docs/RUNBOOK.md
   bajo la sección "Monitoring". No modifiques código de la app.
```

---

### GAP-6 — DPA con contenido placeholder antes de beta pública

**Quién lo resuelve:** Requiere acción del usuario primero

**Necesito que me proporciones:**
- [ ] Nombre legal de la empresa / razón social
- [ ] RFC o número de registro fiscal
- [ ] País y estado de constitución legal
- [ ] Email de contacto legal (ej. legal@fudimenu.app)
- [ ] Nombre del representante legal o DPO
- [ ] Decisión: ¿FudiMenu procesa datos de tarjetahabientes directamente o los delega 100% a Stripe?
- [ ] Si tienes un template DPA redactado por tu abogado, compártelo

**Prompt (una vez que tengas lo anterior):**

```text
Reemplaza el contenido placeholder de src/app/(public)/legal/dpa/page.tsx con el DPA
real. Estructura mínima: Partes, Objeto, Datos Procesados, Obligaciones del Procesador,
Subprocesadores, Transferencias Internacionales, Duración y Terminación, Contacto DPO.
Elimina el comentario TODO(legal). No modifiques otras páginas legales.
```

