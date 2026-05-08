# PLAN.md - Auditoria MVP FudiMenu

Fecha de auditoria: 2026-05-08

## Veredicto

Estado actual: **MVP NOT READY, pero cercano**.

La base tecnica ya cubre una parte grande del MVP: Next.js App Router, Prisma/Supabase, auth, onboarding, editor con secciones/categorias/items, QR/slug, vista publica, i18n, Cloudinary inicial, billing Stripe inicial, privacidad, CI y tests. El bloqueo principal ya no parece ser "falta todo", sino cerrar huecos de produccion, validar integraciones reales y bajar riesgos de performance/billing/ops.

No modifique codigo ni configuracion durante esta auditoria. Este archivo es el unico cambio solicitado.

## Evidencia Observada

- `package.json` ya usa `eslint . --max-warnings=0` y mantiene scripts para `typecheck`, `test`, `build`, `test:e2e`, Prisma y dev.
- `vitest.config.ts` esta orientado a tests unitarios y hay tests en `tests/unit/**`.
- Existen rutas admin para secciones, categorias, detalle de seccion, editor de item y settings.
- Existen rutas y acciones para Cloudinary, Stripe checkout, Stripe portal y webhook.
- Existe workflow CI y configuracion Lighthouse.
- Existe migracion activa de hardening MVP: `prisma/migrations/007_mvp_schema_hardening/migration.sql`.
- La vista publica `/m/[slug]` renderiza menu, secciones, categorias, items, i18n, WhatsApp y tracking basico.

Riesgos observados:

- La vista publica sigue pesada para el target MVP: el ultimo build observado reporto `/m/[slug]` cerca de `196 kB` First Load JS, por encima del objetivo `<100 kB`.
- La ruta publica usa Prisma en server, por lo que no esta en Edge runtime. Esto puede ser aceptable solo si queda documentado y si Lighthouse cumple.
- En smoke local, `/m/taqueria-don-pepe` mostro "Menu no disponible", probablemente por entorno/seed/mock. Hay que corregir el flujo demo o documentar datos seed obligatorios.
- Billing esta funcional en forma, pero no cerrado para produccion: checkout usa `price_data` dinamico en vez de Price IDs configurados, hay mismatch de variables de entorno y faltan eventos/auditoria de upgrade/downgrade mas explicitos.
- E2E no debe correrse contra una DB real: el setup resetea la base con `pnpm db:push --force-reset` y `pnpm db:seed`.
- `.env.example` no parece cubrir todo lo que el entorno productivo necesita, especialmente `CRON_SECRET` y `STRIPE_PRICE_BUSINESS` server-side.

## Estado Por Feature MVP

### F1 Auth + Onboarding

Estado: **Parcial alto**.

Cubierto:
- Login por Supabase, magic link/OAuth y redireccion con `next`.
- Onboarding con tenant, cuisine, seed inicial y redirect a `/menu?welcome=1`.
- Rutas protegidas y flujo basico de logout.

Pendiente:
- Validacion manual con Supabase real, Google OAuth real y dominio final.
- Confirmar que new-user sin tenant siempre cae en onboarding desde cualquier ruta admin.
- Confirmar envio real de emails via Resend/Supabase y deep links en mobile.

Prompt:
```text
Audita y cierra F1 Auth + Onboarding contra MVP.md sin ampliar scope: verifica magic link, OAuth Google, query next, callback, usuario sin tenant, logout con redirect /login, limpieza de fudi:branch, BroadcastChannel/polling entre tabs y redirect final /menu?welcome=1. Agrega o ajusta tests unitarios/e2e solo donde falte cobertura.
```

### F2 Editor De Menu

Estado: **Parcial alto**.

Cubierto:
- Grid de secciones, crear/editar seccion, cover, color, preview, delete.
- Detalle de seccion con categorias/items.
- CRUD de categorias y reorder con DnD.
- Reorder de secciones con DnD.
- Editor de item con `sectionId` y selector de categorias filtrado.

Pendiente:
- Verificacion visual mobile real del grid 2 columnas, skeletons, empty states, banner welcome y limites Free.
- Verificar que `StockToggle` visible en listas tenga haptic feedback y rollback consistente.
- Verificar que delete soft con "Deshacer" funcione en todos los casos.

Prompts:
```text
Verifica F2 Editor Menu en mobile y desktop contra MVP.md: /menu, /menu/sections/new, /menu/sections/[id]/edit, /menu/s/[sectionId], /menu/categories/new y /menu/categories/[id]/edit. Corrige solo diferencias visuales o funcionales con grid 2-col, cards 4/5, empty states, limits Free, FAB, DnD touch y rollback optimista.
```

```text
Completa la cobertura E2E del flujo seccion -> categoria -> item -> reorder -> delete/restaurar. Usa una DB disposable porque global-setup resetea datos. No uses la DB de produccion.
```

### F3 Stock / Agotado

Estado: **Parcial alto**.

Cubierto:
- Toggle de disponibilidad en editor/listas.
- Estado agotado en vista publica.
- Ocultamiento de WhatsApp para agotados.

Pendiente:
- Haptic feedback consistente en toggle de listas.
- Validar revalidacion publica en menos de 60s con datos reales.
- Confirmar evento `stock_toggled` en PostHog con tenant/plan/route.

Prompt:
```text
Cierra F3 Stock contra MVP.md: asegura que StockToggle en listas y editor tenga haptic feedback, UI optimista con rollback, toast ES/EN, revalidateTag/revalidatePath correcto, tracking stock_toggled y que la vista publica refleje agotado en menos de 60s.
```

### F4 QR + Slug

Estado: **Parcial alto**.

Cubierto:
- Slug publico, validacion, history redirect, QR, tracking inicial.

Pendiente:
- Probar blocklist, debounce, sugerencias, rate limit y redirect 301 por 30 dias.
- Confirmar descarga QR en PNG y PDF segun MVP.
- Confirmar fallback de share en navegador no compatible.

Prompt:
```text
Audita y cierra F4 QR + Slug: blocklist, disponibilidad con debounce, sugerencias, slug_history con 301 por 30 dias, QR PNG/PDF con descarga, share fallback, tracking qr_downloaded y tests unitarios/rate limit.
```

### F5 Vista Publica

Estado: **Parcial medio**.

Cubierto:
- Render publico con secciones, categorias, items, specials, footer Free, i18n y WhatsApp.
- Tracking de `menu_viewed` y `whatsapp_clicked`.
- HTML semantico razonable.

Pendiente critico:
- First Load JS de `/m/[slug]` debe bajar al target MVP `<100 kB` o documentar excepcion aceptada.
- Falta tracking real de `item_viewed`.
- Footer Free debe enlazar a landing segun MVP.
- Documentar runtime Node si Prisma impide Edge.
- Ejecutar Lighthouse mobile real con datos seed validos.

Prompts:
```text
Optimiza /m/[slug] para el budget MVP: reduce First Load JS por debajo de 100 kB, elimina client components innecesarios, difiere tracking/interacciones no criticas, conserva HTML semantico y valida Lighthouse mobile LCP <=1.5s.
```

```text
Cierra F5 Public Menu: agrega item_viewed al abrir/ver item sin duplicar eventos, convierte el footer Free en link a landing, documenta runtime Node si no se usa Edge, y agrega tests/smoke para /m/taqueria-don-pepe con seed valido.
```

### F6 Tema + Cloudinary

Estado: **Parcial alto**.

Cubierto:
- Endpoint de upload Cloudinary con auth y validacion de tamano/tipo.
- Settings de marca con uploader/color/preview.

Pendiente:
- Validar con credenciales reales Cloudinary.
- Resolver mismatch: `.env.example` incluye `CLOUDINARY_UPLOAD_PRESET`, pero el endpoint firmado no parece usarlo.
- Confirmar transformaciones/folder/public_id y limpieza de imagenes reemplazadas si aplica.

Prompt:
```text
Cierra F6 Tema + Cloudinary: valida upload real de logo, item image y section cover con jpg/png/webp/heic <=5MB, alinea .env.example con el flujo firmado real, agrega tests de auth/tamano/tipo y confirma revalidacion de vista publica tras cambios de marca.
```

### F7 i18n ES/EN

Estado: **Parcial alto**.

Cubierto:
- Resolucion por query/cookie/header y cookie persistente.
- Textos principales ES/EN.
- Precio localizado y WhatsApp por locale.

Pendiente:
- Auditoria de strings hardcodeadas.
- Confirmar prioridad exacta `?lang > cookie > Accept-Language > default`.
- Confirmar errores de formularios/toasts en ambos idiomas.

Prompt:
```text
Audita F7 i18n: elimina strings hardcodeadas visibles, verifica prioridad ?lang > cookie > Accept-Language > default, cookie NEXT_LOCALE 1 ano, errores/toasts ES/EN, mensaje WhatsApp por locale y formato de precio por locale.
```

### F8 WhatsApp

Estado: **Parcial alto**.

Cubierto:
- Configuracion de telefono tenant.
- Boton oculto cuando no hay telefono o item agotado.
- Mensaje localizado y tracking.

Pendiente:
- Validacion manual con numero E.164 real.
- Confirmar que el mensaje incluya restaurante, item, precio y URL canonica.

Prompt:
```text
Cierra F8 WhatsApp: valida telefono E.164, mensaje ES/EN con restaurante/item/precio/URL, ocultamiento en agotados y tenants sin telefono, tracking whatsapp_clicked y pruebas mobile de apertura wa.me.
```

### F9 Specials / Happy Hour

Estado: **Parcial medio-alto**.

Cubierto:
- Campos de special price/schedule.
- Render de specials en publico.

Pendiente:
- Confirmar enforcement por plan: Free no deberia activar specials si MVP lo limita a Pro.
- Confirmar cron/revalidacion cuando empieza o termina una promo.
- Confirmar timezone America/Mexico_City o timezone tenant.

Prompt:
```text
Cierra F9 Specials: valida specialPrice, schedule, timezone, render publico, activacion/desactivacion automatica, revalidacion/cron y enforcement por plan segun MVP.md. Agrega tests unitarios para ventanas de tiempo y edge cases.
```

### F10 Billing

Estado: **Parcial y de alto riesgo**.

Cubierto:
- Checkout Stripe para tarjeta en subscription mode.
- OXXO/SPEI como payment mode/manual.
- Customer Portal.
- Webhook con idempotencia basica.
- Persistencia de `stripeCustomerId`/`stripeSubscriptionId`.

Pendiente critico:
- Usar Price IDs reales por plan/ciclo o documentar explicitamente por que se usa `price_data` dinamico.
- `.env.example` debe incluir variables server/client coherentes para Pro/Business mensual/anual.
- UI necesita toggle mensual/anual claro, estado actual y copy sin prometer subscription portal para OXXO/SPEI.
- Webhook debe registrar `plan.upgraded` / `plan.downgraded`, manejar failed payment con email real y ciclo cash/manual.
- Pruebas con Stripe CLI/test clocks para card, OXXO y SPEI.

Prompts:
```text
Rediseña F10 Billing para produccion: usa Stripe Price IDs configurados para Pro/Business mensual/anual, muestra plan actual, toggle mensual/anual con 25% descuento anual, botones Upgrade/Manage segun estado y copy claro para tarjeta recurrente vs OXXO/SPEI manual.
```

```text
Completa Stripe webhook: checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed, payment_intent/charge paid para OXXO/SPEI, idempotencia, audit logs plan.upgraded/plan.downgraded y email de failed payment via Resend.
```

```text
Agrega tests unitarios y de integracion mock para createBillingCheckoutAction, createCustomerPortalAction y webhook Stripe. Incluye casos card subscription, OXXO/SPEI payment, failed payment, subscription canceled y eventos duplicados.
```

### Calidad, Seguridad Y Ops

Estado: **Parcial medio**.

Cubierto:
- CI base.
- Sentry/PostHog inicial.
- Headers de seguridad iniciales.
- Privacidad/export/delete inicial.
- Lighthouse config inicial.

Pendiente critico:
- Lighthouse debe incluir `/menu` ademas de publico.
- Ejecutar E2E con DB disposable.
- Verificar RLS en Supabase real con migraciones activas.
- Confirmar PITR, backups, alertas, status page y rollback.
- Legal pages deben quedar marcadas como pendientes de revision legal externa si no hubo abogado.
- Sentry debe probar scrub PII, tags tenant_id/plan/role y source maps.

Prompts:
```text
Cierra calidad y ops MVP: ajusta CI para typecheck+lint+unit+build, agrega job E2E con DB disposable segura, incluye Lighthouse mobile para /m/taqueria-don-pepe y /menu, documenta rollback y asegura migrate deploy antes de build/start.
```

```text
Cierra seguridad/observabilidad: valida headers, CSP si aplica, Sentry beforeSend PII scrub, tags tenant_id/plan/role, PostHog consent gate, eventos MVP faltantes, RLS en migraciones activas y alertas basicas de uptime/error rate.
```

```text
Cierra privacidad: export JSON, delete con OTP, hard delete cron 30d, audit retention 90d, legal pages con aviso de revision legal externa pendiente y pruebas para export/delete.
```

## Comandos Que Debes Correr Localmente

Antes de correr E2E, usa una base de datos disposable. El setup de E2E puede resetear datos.

### Verificacion estatica y unitaria

```bash
pnpm install
pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

### E2E con DB disposable

Configura `DATABASE_URL` y `DIRECT_URL` hacia una base de test que puedas borrar.

```bash
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3102"
export USE_MOCKS="false"
pnpm test:e2e
```

No ejecutes este comando contra produccion ni staging compartido.

### Smoke local con mocks

```bash
export USE_MOCKS="true"
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3102"
pnpm dev -- --hostname 127.0.0.1 --port 3102
```

Abrir manualmente:

- `http://127.0.0.1:3102/login`
- `http://127.0.0.1:3102/onboarding`
- `http://127.0.0.1:3102/menu`
- `http://127.0.0.1:3102/m/taqueria-don-pepe`

### Lighthouse

```bash
pnpm build
pnpm start
npx -y @lhci/cli@0.13.x autorun
```

Validar especialmente:

- `/m/taqueria-don-pepe`: LCP <= 1.5s, JS inicial segun budget MVP.
- `/menu`: performance mobile > 85.

### Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Tambien probar manualmente:

- Tarjeta subscription mensual.
- Tarjeta subscription anual.
- OXXO payment mode.
- SPEI/customer balance payment mode.
- Customer Portal.

### Bundle analysis

```bash
ANALYZE=true pnpm build
```

Objetivo MVP:

- `/m/[slug]` por debajo de 100 kB First Load JS o excepcion documentada.
- `/menu` por debajo de 250 kB First Load JS.
- `/onboarding` por debajo de 200 kB First Load JS.

## Informacion Que Falta Alimentar

### Supabase

- `DATABASE_URL` pooled.
- `DIRECT_URL` directa para migraciones.
- `NEXT_PUBLIC_SUPABASE_URL`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`.
- Google OAuth Client ID/Secret configurados en Supabase.
- Redirect URLs exactas para local, preview y produccion.
- Confirmacion de PITR/backups habilitados.
- Confirmacion de RLS aplicado en base real.

### Stripe

- `STRIPE_SECRET_KEY`.
- `STRIPE_WEBHOOK_SECRET`.
- Price IDs reales para Pro/Business mensual/anual.
- Decidir nombres finales de variables, por ejemplo:
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_PRO_ANNUAL`
  - `STRIPE_PRICE_BUSINESS_MONTHLY`
  - `STRIPE_PRICE_BUSINESS_ANNUAL`
- Configuracion de Billing Portal en Stripe Dashboard.
- Confirmar si OXXO/SPEI seran prepago/manual y que periodo compran.
- Emails de failed payment y receipts.

### Cloudinary

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- `CLOUDINARY_API_KEY`.
- `CLOUDINARY_API_SECRET`.
- Confirmar si se usa upload preset. Si el flujo es signed upload, quitar `CLOUDINARY_UPLOAD_PRESET` o documentarlo como no requerido.
- Folder/naming final para logos, item images y section covers.

### Email

- `RESEND_API_KEY`.
- Dominio verificado.
- From address final.
- Plantillas para magic link si aplica, failed payment, delete account OTP y avisos criticos.

### PostHog

- `NEXT_PUBLIC_POSTHOG_KEY`.
- `NEXT_PUBLIC_POSTHOG_HOST`.
- Dashboard/funnel MVP:
  - signup_started
  - onboarding_completed
  - menu_viewed
  - item_viewed
  - whatsapp_clicked
  - qr_downloaded
  - plan_upgrade_started
  - plan_upgraded

### Sentry

- `NEXT_PUBLIC_SENTRY_DSN`.
- `SENTRY_DSN`.
- `SENTRY_ORG`.
- `SENTRY_PROJECT`.
- `SENTRY_AUTH_TOKEN`.
- Alertas para error rate y cron failures.
- Confirmar source maps en produccion.

### Upstash / Rate Limit

- `UPSTASH_REDIS_REST_URL`.
- `UPSTASH_REDIS_REST_TOKEN`.
- Politicas finales de rate limit para slug, QR, tracking y auth-adjacent endpoints.

### Produccion / Vercel

- `NEXT_PUBLIC_APP_URL` final.
- `CRON_SECRET`.
- Variables por ambiente: local, preview, production.
- Comando de migracion en deploy.
- Plan de rollback.
- Dominio final y redirects.

### Legal / Operacion

- Paginas legales revisadas por abogado o marcadas como "pendiente de revision legal externa".
- RFC/datos fiscales si se muestran en recibos o terminos.
- Status page o pagina publica de incidentes.
- Canal de alertas: Slack/email.
- Runbook de soporte para restaurantes.

## Orden Recomendado De Ejecucion

1. **Entorno y gates:** alinear `.env.example`, correr static/unit/build y preparar DB disposable para E2E.
2. **Public performance:** bajar `/m/[slug]` debajo del budget o documentar excepcion aceptada.
3. **Billing:** cerrar Price IDs, portal, webhook, OXXO/SPEI y emails.
4. **E2E:** onboarding, secciones, categorias, items, stock, tenant isolation, billing mock.
5. **Integraciones reales:** Supabase Auth, Cloudinary, Stripe CLI, Resend, PostHog, Sentry.
6. **Ops/legal:** RLS real, PITR, cron secret, alerts, status page, legal review.
7. **Manual MVP:** ejecutar checklist end-to-end en mobile y desktop antes de declarar ready.

## Checklist Final Para Declarar MVP Ready

- `pnpm typecheck` pasa.
- `pnpm lint` pasa.
- `pnpm test --run` pasa.
- `pnpm build` pasa.
- `pnpm test:e2e` pasa contra DB disposable.
- Lighthouse mobile pasa en `/m/taqueria-don-pepe` y `/menu`.
- Magic link y Google OAuth funcionan en produccion.
- Onboarding termina en `/menu?welcome=1`.
- Seccion -> categoria -> item -> stock -> vista publica funciona.
- QR descarga y share funcionan.
- WhatsApp abre con mensaje correcto.
- Stripe card mensual/anual funciona.
- OXXO/SPEI no promete subscripcion recurrente.
- Customer Portal funciona para suscripciones card.
- Webhooks actualizan plan y registran auditoria.
- Export/delete account funcionan.
- Sentry/PostHog no capturan PII sensible.
- RLS/migraciones aplicadas en Supabase real.
- Backups/PITR/rollback documentados.
- Legal pages revisadas o marcadas como pendientes de revision externa.

