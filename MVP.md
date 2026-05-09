# FudiMenu — MVP Spec & Audit Checklist

**Versión:** 1.0
**Fecha lock:** 2026-05-08
**Status:** Draft auditable
**Owner:** PM/CTO

---

## Cómo usar este documento

Este doc es **especificación + checklist de auditoría** del MVP. Cada sección lista funcionalidades con **criterios de aceptación binarios** (✅/❌). Una auditoría exitosa marca todos los criterios como ✅. Si quedan ❌, el MVP NO está listo para beta cerrada.

**Niveles:**
- 🔴 **Crítico** — bloquea launch. ❌ aquí = stop.
- 🟡 **Alto** — debe estar antes de beta pública.
- 🟢 **Nice-to-have** — puede diferirse a v1 si tiempo apremia.

**Auditoría = correr este doc línea por línea, marcando cada bullet con check real validado en código + tests + UI live.**

---

## 0. Scope MVP

### IN scope (debe estar funcionando)

| # | Feature | Prioridad |
|---|---|---|
| F1 | Auth + onboarding (magic link + Google) | 🔴 |
| F2 | Editor menú móvil (CRUD secciones, categorías, items) | 🔴 |
| F3 | Toggle agotado con sync inmediato | 🔴 |
| F4 | Link público + QR descargable | 🔴 |
| F5 | Vista comensal LCP <1.5s (ajustado de <1s real-world) | 🔴 |
| F6 | Tema básico (logo + color primario + slug) | 🔴 |
| F7 | Multi-idioma comensal ES/EN | 🟡 |
| F8 | WhatsApp deep link en vista comensal | 🟡 |
| F9 | Especiales del día | 🟡 |
| F10 | Plan Free/Pro con Stripe + OXXO + SPEI | 🔴 |

### OUT of scope (NO debe estar — descartar PRs que lo intenten)

- Multi-sucursal feature completa (schema lockeado, UI postponed)
- Pedidos in-app (solo deep link WhatsApp)
- POS sync
- Reservas
- App nativa iOS/Android
- Modificadores items (extras, tamaños)
- Importador PDF → IA
- Marketplace plantillas
- Reseñas / rating
- Pagos in-app comensal
- Newsletter / mailing masivo

---

## 1. Auth + Onboarding (F1)

### 1.1 Login

- [ ] `/login` accesible sin sesión
- [ ] Input email validado (Zod regex email)
- [ ] Botón "Mándame link" envía via Server Action `signInWithMagicLinkAction`
- [ ] Email magic link llega via Resend (dev: log a consola, prod: email real)
- [ ] Tras tap link → `/auth/callback` → exchange code → cookie session httpOnly
- [ ] BroadcastChannel cross-tab notifica al tab original tras login en tab nuevo
- [ ] Polling fallback 30s si BroadcastChannel no disponible
- [ ] Botón "Continuar con Google" funciona (OAuth Supabase)
- [ ] Después de login, redirect a `/dashboard` (o `next` query param respetado)
- [ ] Rate limit: 5 magic links/hora por email + 20/hora por IP → 429 si excede

### 1.2 Signup → Onboarding Wizard

- [ ] User nuevo sin tenant → middleware redirige a `/onboarding`
- [ ] Wizard máx 2 pasos (post-refactor F2-01) o 4 (versión actual)
- [ ] Paso 1: nombre restaurante + tipo cocina (chips)
- [ ] Paso 2: primer platillo opcional (con skip funcional)
- [ ] `completeOnboardingAction`:
  - [ ] Valida input con Zod
  - [ ] Crea tenant con slug auto-generado (slugify)
  - [ ] Crea sección "Menú" default
  - [ ] Crea categorías por cuisine (auto-seed)
  - [ ] Crea membership rol `owner`
  - [ ] Setea `ACTIVE_TENANT_COOKIE` httpOnly
  - [ ] Si user ya tiene membership → modal "Ya tienes este restaurante" con opción crear otro
- [ ] Slug colisión → server sugiere variante automática (slug-2, slug-tj, etc.)
- [ ] Tras finish: redirect `/menu?welcome=1` con banner activación

### 1.3 Logout

- [ ] Botón "Cerrar sesión" en `/account`
- [ ] `signOutAction` borra session Supabase + ACTIVE_TENANT_COOKIE
- [ ] Limpia localStorage `fudi:branch`
- [ ] Redirect a `/login`

### 1.4 Multi-tenant switcher

- [ ] User con 2+ memberships → `TenantSwitcher` visible en `AppHeader`
- [ ] User con 1 membership → `TenantSwitcher` no se muestra
- [ ] Cambio de tenant es 1-tap (auto-submit dropdown)
- [ ] `switchActiveTenantAction` valida membership server-side
- [ ] No permite switch a tenant sin membership → audit log + error

### 1.5 Auth security

- [ ] Cookies httpOnly + Secure (prod) + SameSite=Lax
- [ ] Session refresh sliding 30 días
- [ ] Cookie `ACTIVE_TENANT_COOKIE` validada en `requireAuth`
- [ ] Cookie inválida → audit log `auth.invalid_tenant_cookie` + cae a primer membership
- [ ] Magic link single-use, expira 1h

---

## 2. Editor Menú (F2)

### 2.1 Estructura jerárquica

- [ ] Modelo: `MenuSection` (parent) → `Category` (child) → `MenuItem`
- [ ] `MenuSection` tiene: name, coverImageUrl, accentColor, sortOrder, isVisible
- [ ] `Category` tiene: sectionId (nullable), name, sortOrder, isVisible
- [ ] `MenuItem` tiene: categoryId, name, description, priceCents, currency, imageUrl, isAvailable, isSpecialToday, specialPrice
- [ ] Soft delete `deletedAt` en sections, categories, items

### 2.2 `/menu` — Grid de secciones

- [ ] Pantalla principal admin = grid 2-col de secciones
- [ ] Cada card sección: cover image (o placeholder emoji) + nombre + bg accentColor
- [ ] Card "Nueva sección" con icono `+` al final del grid
- [ ] Empty state si 0 secciones con CTA "Crear primera sección"
- [ ] Loading: skeleton 4 cards aspect-[4/5]
- [ ] Banner welcome=1 visible al venir de onboarding

### 2.3 `/menu/sections/new` y `/menu/sections/[id]/edit`

- [ ] Form con: name (req), accentColor (preset chips o picker), coverImageUrl (uploader Cloudinary)
- [ ] Preview live del card mientras edita color
- [ ] Botón delete (solo en edit) con confirm
- [ ] `upsertSectionAction` valida con Zod, persiste, revalida menu
- [ ] Tras save → redirect `/menu`
- [ ] Toast "Guardado" / "Sección eliminada"

### 2.4 `/menu/s/[sectionId]` — Detail sección

- [ ] AppHeader con título = sección.name + back chevron + ícono settings (link a edit)
- [ ] Items agrupados por categoría dentro de la sección
- [ ] Cada categoría: header sticky/normal con nombre + items list
- [ ] Empty state si sección sin items
- [ ] FAB inferior derecho `+` → `/menu/new?sectionId=X`

### 2.5 `/menu/[id]` — Editor item

- [ ] Crear (`id=new`) o editar existente
- [ ] Si `?sectionId=X`: filtra categorías al selector solo de esa sección
- [ ] Si sección sin categorías: banner "Crea una categoría primero" con CTA
- [ ] Form (RHF + Zod):
  - [ ] name (req, max 80 chars)
  - [ ] description (opcional, max 500 chars con char counter visible)
  - [ ] priceCents (req, min 1, type-safe via `usePriceInput` hook)
  - [ ] categoryId (selector chips)
  - [ ] imageUrl (Cloudinary signed upload, opcional)
  - [ ] isAvailable (toggle visualmente separado del form)
  - [ ] isSpecialToday + specialPrice (opcional)
- [ ] Botones: Cancelar, Guardar, Eliminar (solo edit)
- [ ] Save → toast "✓ Guardado" → redirect `/menu/s/[sectionId]` o `/menu`
- [ ] Delete → soft delete + toast "Platillo eliminado [Deshacer]" 5s
- [ ] Undo restora item en mismo toast
- [ ] Sanitize XSS server-side (sanitizePlainText) en name + description

### 2.6 Categorías CRUD

- [ ] `/menu/categories/new?sectionId=X` crea categoría
- [ ] Editar categoría desde detail sección o item editor
- [ ] Reorder categorías dentro de sección (drag & drop)
- [ ] Delete categoría: items quedan con `categoryId=null` (no cascade delete items)

### 2.7 Reorder secciones

- [ ] Modo "Reordenar" toggle en `/menu` header
- [ ] Drag handles visibles solo en modo reorder
- [ ] @dnd-kit/sortable funcional en mobile (touch sensor)
- [ ] `reorderSectionsAction` persiste `sortOrder` atómico en transaction
- [ ] Optimistic UI con rollback si server falla

### 2.8 Plan limits

- [ ] Free: max 20 items totales por tenant
- [ ] Free: max 5 secciones
- [ ] Hit límite: banner amarillo "X items restantes en Free"
- [ ] En límite: bloquear `/menu/new` con paywall card "Upgrade →"
- [ ] Pro: ilimitado

---

## 3. Stock Toggle (F3)

- [ ] Toggle visible en card item de lista (`/menu/s/[sectionId]`)
- [ ] Toggle visible en editor item separado de form
- [ ] 1 tap cambia disponibilidad
- [ ] Optimistic update (UI cambia inmediato)
- [ ] Server Action `toggleItemAvailabilityAction` persiste
- [ ] Si server falla → rollback UI + toast error
- [ ] Vista comensal `/m/[slug]` refleja agotado en <60s (via revalidateTag)
- [ ] Item agotado en vista comensal: overlay "Agotado" + opacity reducida + WhatsApp button hidden
- [ ] Haptic light feedback en toggle (mobile)
- [ ] Track event `stock_toggled` a PostHog

---

## 4. Link Público + QR (F4)

### 4.1 Slug

- [ ] Slug único por tenant
- [ ] Validación: regex `^[a-z0-9-]+$`, min 4 chars, max 48
- [ ] Blocklist: admin, api, www, app, login, dashboard, etc.
- [ ] Cambio slug: redirect 301 viejo→nuevo 30 días via tabla `slug_history`
- [ ] Real-time check disponibilidad en `/settings/brand` con debounce
- [ ] Sugerencia automática si tomado

### 4.2 QR endpoint

- [ ] `GET /api/qr/[slug]` retorna PNG 600x600
- [ ] Margen 2, error correction H, color custom (ink-900 sobre crema-50)
- [ ] `?download=1` agrega header Content-Disposition attachment
- [ ] Cache-Control: public max-age=86400 immutable
- [ ] Rate limit: 30 req/min por IP+slug
- [ ] URL embebida usa `NEXT_PUBLIC_APP_URL` (no hardcoded)

### 4.3 `/qr` admin page

- [ ] Pantalla con QR grande (280x280)
- [ ] Link copiable del menú público
- [ ] Botón "Descargar PNG"
- [ ] Botón "Compartir" (navigator.share o copy fallback)
- [ ] Texto promo "Pega esto donde sea"

### 4.4 Compartir nativo

- [ ] Botón share en `/qr` y vista comensal admin
- [ ] Web Share API si disponible
- [ ] Fallback: copy to clipboard + toast "Link copiado"
- [ ] Track event `qr_downloaded` con format png/pdf

---

## 5. Vista Comensal (F5)

### 5.1 Render

- [ ] Ruta `/m/[slug]` accesible público sin auth
- [ ] RSC + ISR `revalidate = 60`
- [ ] Edge runtime (o Node si Prisma incompatible — documentado)
- [ ] LCP <1.5s P75 en 3G fast (validado Lighthouse)
- [ ] INP <200ms
- [ ] CLS <0.1
- [ ] Funciona sin JavaScript para core browse (degradación grácil)

### 5.2 Layout

- [ ] Header: logo (o placeholder emoji), nombre tenant, language switcher esquina
- [ ] Sticky nav: chips por sección con scroll horizontal smooth
- [ ] Chip "Especiales de hoy" coral 🔥 si hay specials
- [ ] Anchor scroll smooth hacia secciones
- [ ] Sections renderizadas con header bg accentColor + categorías como sub-headers
- [ ] Items cards: foto 80x80 + nombre + descripción 2 líneas + precio
- [ ] Item agotado: overlay "Agotado" + sin botón WhatsApp
- [ ] Item special: badge "Especial 🔥" + precio especial si específicado

### 5.3 Footer

- [ ] Plan Free: "Hecho con FudiMenu" footer visible (con link a landing)
- [ ] Plan Pro/Business: footer oculto

### 5.4 Metadata + SEO

- [ ] `generateMetadata` retorna título y descripción dinámicos
- [ ] OG image dinámica `/api/og/[slug]` (opcional MVP, puede ser default)
- [ ] Estructura HTML semántica (article, section, h1/h2/h3)

### 5.5 Analytics

- [ ] `POST /api/track/view` registra menu_view con IP anonymized + UA parsed
- [ ] Cookie consent banner aparece en 1ra visita
- [ ] Si decline: posthog.opt_out_capturing()
- [ ] Save-to-home prompt PWA en 2da visita (después de consent decided)

---

## 6. Tema (F6)

### 6.1 `/settings/brand`

- [ ] Editar slug (con check disponibilidad)
- [ ] Editar primaryColor (hex picker o presets)
- [ ] Upload logo via Cloudinary signed (max 5MB, jpg/png/webp/heic)
- [ ] Preview live mientras edita
- [ ] Save persiste + revalida vista comensal

### 6.2 `/settings/contact`

- [ ] Editar `whatsappPhone` (validación E.164 generalizada, no solo +52)
- [ ] Editar `businessHours` (texto libre)
- [ ] Save persiste + revalida vista comensal

### 6.3 Aplicación tema en vista comensal

- [ ] `--brand` CSS var con primaryColor
- [ ] Logo o placeholder con bg primaryColor + opacidad
- [ ] Nombre tenant prominente
- [ ] Identidad visual coherente

---

## 7. i18n ES/EN (F7)

- [ ] `next-intl` integrado (no JSON suelto)
- [ ] Mensajes en `src/i18n/messages/es.json` y `en.json`
- [ ] Locale resolución: query `?lang=` > cookie > Accept-Language > default ES
- [ ] Cookie `NEXT_LOCALE` persiste 1 año
- [ ] `useTranslations` en componentes RSC y client
- [ ] Cookie consent traducido
- [ ] Errores `toUserMessage(err, locale)` retornan ES o EN
- [ ] WhatsApp message message en idioma correcto
- [ ] Format precio con `Intl.NumberFormat` por locale (es-MX, en-US)
- [ ] Vista comensal: language switcher visible esquina header

---

## 8. WhatsApp Deep Link (F8)

- [ ] Tenant configura `whatsappPhone` en `/settings/contact`
- [ ] Vista comensal: cada item disponible con `whatsappPhone` configurado muestra botón "Pedir por WhatsApp"
- [ ] Mensaje pre-armado: `"Hola! Vi tu menú en {APP_URL}/m/{slug} y quiero pedir:\n- {itemName} x1\n¿Tienen disponibilidad?"`
- [ ] URL: `https://wa.me/{phone}?text={encoded message}`
- [ ] Tap abre WhatsApp app o web.whatsapp.com
- [ ] Sin `whatsappPhone`: botón no se muestra
- [ ] E.164 validation soporta múltiples países (MX, CO, PE, US)

---

## 9. Especiales del Día (F9)

- [ ] Campo `isSpecialToday` boolean en MenuItem
- [ ] Campo `specialPrice` int nullable (precio especial diferente al normal)
- [ ] Dashboard admin: card "Especial de hoy" con item actual o CTA "Agregar"
- [ ] Cambiar/quitar especial desde dashboard
- [ ] Vista comensal: badge "Especial 🔥" en card item + sección dedicada top
- [ ] Si specialPrice presente, se usa en vista comensal
- [ ] Cron diario opcional: notification "¿Especial de hoy?" 10am (post-MVP)

---

## 10. Plan Billing (F10)

### 10.1 Stripe Checkout

- [x] `createBillingCheckoutAction` genera Stripe session
- [x] Payment methods: `['card', 'oxxo', 'customer_balance']`
- [x] customer_balance config: bank_transfer.type='mx_bank_transfer', requested_address_types=['spei']
- [x] success_url + cancel_url respetan `NEXT_PUBLIC_APP_URL`
- [x] metadata.tenantId presente para mapping post-pago

### 10.2 Stripe Customer Portal

- [x] `createCustomerPortalAction` redirect a Stripe portal — gated on stripeCustomerId + stripeSubscriptionId
- [x] User puede: cancel, update payment method, ver invoices

### 10.3 Webhook

- [x] `POST /api/webhooks/stripe` con runtime nodejs
- [x] Verify signature con `STRIPE_WEBHOOK_SECRET`
- [x] Idempotency vía tabla `webhookEvent` (id+type+processedAt)
- [x] Maneja: `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`
- [x] Actualiza `tenant.plan` según evento
- [x] OXXO/SPEI: solo actualiza si `payment_status = 'paid'` — async via `payment_intent.succeeded`
- [x] Failed payment: email automático via `billingService.sendPaymentFailedEmail`
- [x] Audit log cada evento procesado

### 10.4 Plan limits enforcement

- [x] Free: 20 items, 5 secciones, marca FudiMenu visible, sin analytics
- [x] Pro: ilimitado, sin marca, analytics
- [x] Business: + multi-sucursal (UI deferred)
- [ ] Enforcement server-side en mutations
- [ ] UI muestra upsell contextual al hit límite

### 10.5 Trial

- [x] Signup automático trial 14 días Pro
- [x] Email D12: "2 días para terminar trial"
- [x] Sin tarjeta al final → downgrade Free automático

### 10.6 `/settings/billing`

- [x] Lista 3 planes con features
- [x] Plan actual marcado con badge
- [x] Toggle mensual/anual con descuento 25% (3m gratis)
- [x] Botón "Upgrade" o "Manage" según estado
- [x] Métodos pago aceptados visibles — copy en UI + button labels (OXXO/SPEI/card)

---

## 11. Quality Gates

### 11.1 Performance

- [ ] LCP `/m/[slug]` <1.5s P75 en mobile 3G fast
- [ ] LCP `/menu` admin <2s P75
- [ ] INP <200ms en interacciones críticas (toggle, save)
- [ ] CLS <0.1 en todas pantallas
- [ ] Bundle First Load JS:
  - [ ] `/m/[slug]` <100kb gzipped
  - [ ] `/menu` <250kb gzipped
  - [ ] `/onboarding` <200kb gzipped
- [ ] Lighthouse CI gate en PRs (configurado)
- [ ] Imágenes via Cloudinary con auto-format + auto-quality

### 11.2 Accessibility

- [ ] WCAG AA contraste en todo texto
- [ ] Tap targets min 48x48
- [ ] Focus visible en todos elementos interactivos
- [ ] Aria labels en botones sin texto (FAB, toggles, switcher)
- [ ] Reduced motion respeta `prefers-reduced-motion`
- [ ] Form inputs con labels asociados (htmlFor)
- [ ] Skip-to-content link en pantallas con sticky nav
- [ ] Keyboard navigation funcional en admin
- [ ] Lighthouse a11y score >90

### 11.3 Security

- [ ] CSP con nonce per request configurada
- [ ] Headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy
- [ ] CSRF protection (Server Actions built-in Next.js)
- [ ] Rate limit en endpoints sensibles vía Upstash:
  - [ ] Magic link: 5/h email + 20/h IP
  - [ ] Track view: 60/min IP+slug
  - [ ] QR PNG: 30/min IP
  - [ ] Account export: 1/24h user
  - [ ] Account delete request: 3/h user
  - [ ] Server Actions items: 200/min tenant
- [ ] Tenant isolation:
  - [ ] Toda query Prisma filtra por tenantId
  - [ ] ESLint custom rule `fudimenu/require-tenant-id-in-prisma-findmany` activa
  - [ ] E2E test verifica tenant A no puede leer/mutar data de B
- [ ] Stripe webhook verify signature obligatorio
- [ ] Magic link single-use, expire 1h
- [ ] Sanitize plain text server-side en name + description
- [ ] No secrets en client bundle (validado con env split)
- [ ] Sentry scrubbing PII en `beforeSend` (no email, no IP)
- [ ] Account delete con OTP 6 dígitos email confirmation

### 11.4 Privacy

- [ ] Privacy policy publicada `/legal/privacy`
- [ ] Terms of Service `/legal/terms`
- [ ] DPA template `/legal/dpa`
- [ ] Cookie consent banner vista comensal
- [ ] PostHog respeta opt-out
- [ ] IP anonimizada server-side (truncate último octeto IPv4)
- [ ] User Agent parsed solo a {browser, os, deviceType}
- [ ] Endpoint `/api/account/export` retorna JSON con datos del tenant
- [ ] Endpoint `/api/account/delete` con OTP confirma + soft delete
- [ ] Hard delete cron 30d después
- [ ] Audit log retention 90 días con cron cleanup

### 11.5 Reliability

- [ ] Disponibilidad target 99.9%
- [ ] Status page público (Better Stack o Instatus)
- [ ] Sentry capturando errors con tags tenant_id, plan, role
- [ ] Stripe webhook idempotency cubre replays
- [ ] Backups Supabase PITR 7d activos
- [ ] DB migrations checked-in y aplicadas via `migrate deploy` en CI
- [ ] No data loss path: soft delete primero, hard delete cron

### 11.6 Observability

- [ ] PostHog inicializado con consent gate
- [ ] Eventos clave instrumentados:
  - [ ] `signup`
  - [ ] `onboarding_completed`
  - [ ] `item_created`
  - [ ] `item_edited`
  - [ ] `stock_toggled`
  - [ ] `qr_downloaded`
  - [ ] `menu_viewed` (vista pública)
  - [ ] `item_viewed`
  - [ ] `whatsapp_clicked`
  - [ ] `plan_upgrade_started`
  - [ ] `plan_upgraded`
- [ ] Sentry tags: tenant_id, plan, role
- [ ] Audit log:
  - [ ] auth.invalid_tenant_cookie
  - [ ] tenant.created
  - [ ] tenant.slug_changed
  - [ ] item.deleted
  - [ ] plan.upgraded
  - [ ] plan.downgraded
  - [ ] webhook.stripe.* eventos
- [ ] Dashboards internos: PostHog activación funnel + Stripe revenue + Supabase health

---

## 12. Tests Cobertura

### 12.1 Unit (Vitest)

- [ ] `tests/unit/menu-service.test.ts` — CRUD items + categories + sections
- [ ] `tests/unit/menu-sections.repository.test.ts` — tenant isolation
- [ ] `tests/unit/sections-actions.test.ts` — Server Actions sections
- [ ] `tests/unit/items-actions.test.ts` — Server Actions items
- [ ] `tests/unit/billing-actions.test.ts` — Stripe checkout SPEI
- [ ] `tests/unit/stripe-webhook.test.ts` — signature, idempotency, plan updates
- [ ] `tests/unit/ratelimit.test.ts` — allowed/denied/bypass
- [ ] `tests/unit/sanitize.test.ts` — XSS strip
- [ ] `tests/unit/whatsapp.test.ts` — E.164 validation + URL build
- [ ] `tests/unit/use-price-input.test.ts` — typing UX
- [ ] `tests/unit/track-view-ua.test.ts` — UA anonymization
- [ ] `tests/unit/audit-log-retention.test.ts` — cron 90d
- [ ] `tests/unit/api-client.test.ts` — backoff + jitter
- [ ] `tests/unit/repository-isolation.test.ts` — mock vs prisma DI
- [ ] `pnpm test --run` reporta `0 failed`
- [ ] Coverage services >80%

### 12.2 E2E (Playwright)

- [ ] `tests/e2e/onboarding.spec.ts` — signup → onboarding → primer item visible
- [ ] `tests/e2e/item-edit.spec.ts` — editar precio → vista comensal refleja en <65s
- [ ] `tests/e2e/stock-toggle.spec.ts` — toggle → vista comensal agotado
- [ ] `tests/e2e/tenant-isolation.spec.ts` — A no lee/muta B
- [ ] `tests/e2e/sections.spec.ts` — crear sección → categoría → item → vista comensal
- [ ] `tests/e2e/billing.spec.ts` — checkout mock → plan upgraded
- [ ] `pnpm test:e2e` reporta `0 failed`

### 12.3 Performance

- [ ] Lighthouse CI configurado en GitHub Actions
- [ ] Budget gate: perf >90, LCP <1500ms en `/m/[slug]`
- [ ] Bundle analyzer corrido y baseline documentada en CLAUDE.md

### 12.4 Manual smoke tests

- [ ] Signup nuevo → onboarding → ver menú live <2 min
- [ ] Editar precio → escanear QR en otro device → ver precio nuevo en <65s
- [ ] Toggle agotado → mismo flow → ver "Agotado" en comensal
- [ ] Crear 21 items en plan Free → bloqueado con paywall
- [ ] Upgrade Pro vía Stripe test card → 21° item permitido
- [ ] Cancelar plan → permanece Pro hasta fin period → luego Free
- [ ] Magic link en celular distinto al que solicitó → cross-tab login funciona
- [ ] WhatsApp deep link abre app correcta con mensaje pre-armado

---

## 13. Stack Lock

### 13.1 Frontend

- [ ] Next.js 15.x App Router
- [ ] React 19 RC
- [ ] TypeScript strict mode (`"strict": true`)
- [ ] Tailwind CSS + shadcn-style components
- [ ] TanStack Query (server state)
- [ ] Zustand (UI state, persist selectivo)
- [ ] React Hook Form + Zod (forms)
- [ ] vaul (bottom sheets)
- [ ] sonner (toasts)
- [ ] @dnd-kit (drag & drop reorder)
- [ ] next-intl (i18n)
- [ ] lucide-react (íconos)

### 13.2 Backend

- [ ] Supabase (Auth + Postgres)
- [ ] Prisma 7 ORM con `@prisma/adapter-pg`
- [ ] Server Actions para mutaciones admin
- [ ] Route Handlers solo para webhooks/QR/upload
- [ ] Repository pattern con DI por env
- [ ] Singleton mock repository en USE_MOCKS=true

### 13.3 Servicios

- [ ] Cloudinary (imágenes signed upload)
- [ ] Stripe (checkout + portal + webhooks)
- [ ] Resend (email transaccional)
- [ ] Upstash Redis (rate limit)
- [ ] PostHog (analytics)
- [ ] Sentry (error tracking + replay)
- [ ] Vercel (hosting + cron + edge)

### 13.4 DB Schema

- [ ] Tablas: tenants, memberships, menuSection, categories, items, itemTranslations, slugHistory, menuViews, itemViews, auditLog, webhookEvents, accountDeleteRequest
- [ ] Soft delete `deletedAt` en entidades borrables
- [ ] Índices en (tenantId, deletedAt), (tenantId, sortOrder)
- [ ] RLS policies (segunda capa defense-in-depth)
- [ ] Constraints unique slug por tenant activo

---

## 14. Env Vars Críticas

Verificar todas presentes en producción:

- [ ] `DATABASE_URL`, `DIRECT_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO`, `NEXT_PUBLIC_STRIPE_PRICE_BUSINESS`
- [ ] `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `RESEND_API_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] `CRON_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `USE_MOCKS=false` en prod
- [ ] Validation en `src/lib/env.ts` con `@t3-oss/env-nextjs`

---

## 15. Deployment Readiness

### 15.1 Build

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0 (con custom rule fudimenu/require-tenant-id activa)
- [ ] `pnpm build` exit 0 con bundle analyzer
- [ ] `pnpm test --run` exit 0
- [ ] `pnpm test:e2e` exit 0

### 15.2 CI/CD

- [ ] GitHub Actions workflow CI (typecheck + lint + test + build)
- [ ] GitHub Actions workflow Lighthouse CI
- [ ] Vercel preview deploys per PR
- [ ] Auto-deploy main → producción

### 15.3 Migrations

- [ ] `prisma migrate deploy` en pipeline antes de start
- [ ] Migrations checked-in
- [ ] Rollback plan documentado

### 15.4 Monitoring activo

- [ ] Sentry recibe errores en producción
- [ ] PostHog recibe eventos
- [ ] Better Stack pings status page
- [ ] Slack alerts configuradas para Sentry P0

### 15.5 Backups

- [ ] Supabase PITR 7d activado (Pro plan)
- [ ] Cloudinary backup mensual cron (post-MVP)
- [ ] DB restore drill ejecutado al menos 1x

### 15.6 Legal

- [ ] Privacy policy revisada por abogado
- [ ] ToS revisado por abogado
- [ ] DPA disponible para clientes Pro+
- [ ] RFC mexicano para facturar (Stripe + Facturapi opcional)

---

## 16. UX Mínimos

### 16.1 Onboarding success

- [ ] Tiempo signup → primer menú live: <2 min P75
- [ ] Drop tasa wizard: <30%
- [ ] Auto-seed funciona si user skip primer item

### 16.2 Daily flow

- [ ] Editar precio item: <15 segundos P75
- [ ] Toggle agotado: <3 segundos P75
- [ ] Crear nuevo item completo: <60 segundos P75
- [ ] Cambiar slug: <30 segundos P75

### 16.3 Errors UX

- [ ] Toast errors no bloqueantes
- [ ] Loading states con skeletons (no spinners solos)
- [ ] Empty states con emoji + texto humano + CTA claro
- [ ] Offline banner si sin conexión
- [ ] Errors fatales: pantalla con retry button

### 16.4 Mobile-first

- [ ] Funciona en iPhone SE (320x568) sin overflow
- [ ] Funciona en Android mid-range (360x640)
- [ ] Funciona en iPhone 15 Pro Max (430x932)
- [ ] Tap targets nunca menores a 48x48
- [ ] Bottom nav nunca solapa con FAB
- [ ] Sticky headers no rompen scroll iOS
- [ ] Safe area insets respetadas (`pb-safe`, `pt-safe`)

---

## 17. Checklist Auditoría Final

Ejecutar **EN ORDEN** antes de declarar MVP listo. Cada uno debe pasar.

### Audit 1: Build & Tests

```bash
pnpm typecheck && echo "TYPECHECK ✅" || echo "TYPECHECK ❌"
pnpm lint && echo "LINT ✅" || echo "LINT ❌"
pnpm test --run && echo "UNIT ✅" || echo "UNIT ❌"
pnpm test:e2e && echo "E2E ✅" || echo "E2E ❌"
pnpm build && echo "BUILD ✅" || echo "BUILD ❌"
```

Todo debe imprimir ✅. ❌ → bloquea.

### Audit 2: Smoke test producción staging

- [ ] Visit `/` → landing carga <2s
- [ ] Visit `/m/taqueria-don-pepe` → menú demo carga <1.5s LCP
- [ ] Visit `/login` → magic link enviado a email real (no log)
- [ ] Email recibido con link funcional
- [ ] Click link → redirect dashboard
- [ ] `/onboarding` → wizard funcional → menú creado
- [ ] `/menu` → grid secciones visible
- [ ] Crear sección → editar → eliminar → flujo completo
- [ ] Crear item → toggle stock → vista comensal refleja
- [ ] `/qr` → descargar PNG funciona
- [ ] Compartir link → WhatsApp deep link armado correcto
- [ ] `/settings/billing` → checkout Stripe test → upgrade exitoso
- [ ] Webhook recibido → `tenant.plan` actualizado en DB
- [ ] `/account` → export descarga JSON → delete con OTP funciona

### Audit 3: Security check

- [ ] DevTools Network: ver header `Content-Security-Policy` con nonce en cada response
- [ ] DevTools Application: cookies httpOnly + Secure
- [ ] Login con tenant A, modificar `ACTIVE_TENANT_COOKIE` en DevTools → request a `/api/items` no devuelve data de B
- [ ] Inyectar `<script>alert(1)</script>` en descripción item → renderiza pero no ejecuta + DB no contiene tag
- [ ] 31 calls a `/api/qr/test-slug` rápido → 31° devuelve 429 con Retry-After
- [ ] 6 magic links a mismo email en 1h → 6° error rate_limited
- [ ] curl webhook Stripe sin signature → 400
- [ ] curl webhook Stripe con signature válida + mismo eventId 2x → 2° retorna 200 sin re-procesar

### Audit 4: Privacy check

- [ ] Visit `/m/taqueria-don-pepe` en incognito
- [ ] Cookie consent visible
- [ ] Tap "No, gracias" → posthog opt-out (verificar en console)
- [ ] DB query menuViews: campo `userAgent` es JSON con shape limitado, NO string completo
- [ ] DB query menuViews: campo `ipHash` o IP truncada
- [ ] Página `/legal/privacy` carga
- [ ] Página `/legal/terms` carga
- [ ] Página `/legal/dpa` carga
- [ ] Account delete: OTP enviado a email, código incorrecto rechazado, código correcto borra cuenta

### Audit 5: Performance check

- [ ] Lighthouse mobile en `/m/taqueria-don-pepe`:
  - [ ] Performance >90
  - [ ] Accessibility >90
  - [ ] Best Practices >90
  - [ ] SEO >90
- [ ] Lighthouse mobile en `/menu`:
  - [ ] Performance >85
- [ ] LCP P75 <1500ms en WebPageTest 3G fast
- [ ] Bundle `/m/[slug]` First Load JS <100kb gzipped
- [ ] No layout shifts visibles al cargar imágenes

### Audit 6: Cross-browser

- [ ] iOS Safari 15+ funciona
- [ ] Chrome Android (último estable) funciona
- [ ] Firefox Android funciona
- [ ] Desktop Chrome/Safari/Firefox funciona
- [ ] Touch gestures (swipe, long-press, drag) responden bien

### Audit 7: i18n check

- [ ] `/m/taqueria-don-pepe` default ES
- [ ] `?lang=en` cambia a inglés (todos strings traducidos)
- [ ] Cookie consent traducido
- [ ] Format precio cambia ($120 MXN vs $120.00 MX)
- [ ] Errores en idioma correcto

### Audit 8: Stripe end-to-end

- [ ] Checkout test card 4242 → success → webhook → plan=pro
- [ ] Checkout OXXO test → pending → manual confirmation → plan=pro
- [ ] Checkout SPEI test → pending → bank ref returned
- [ ] Customer portal → cancel → end of period → plan=free
- [ ] Failed payment webhook → email recibido

---

## 18. Post-MVP (NO en este audit)

Estos NO son criterios MVP. Documentados solo para evitar scope creep:

- Multi-sucursal feature completa
- Modificadores items
- POS sync (Loyverse, Square)
- Recomendador IA
- Reseñas comensal
- Pagos in-app comensal
- App nativa iOS/Android
- App Clip iOS
- Newsletter digest semanal automatizado
- Marketplace plantillas
- Importador PDF→IA
- Pedidos in-app (más allá de WhatsApp deep link)

---

## 19. Sign-off

Audit completado por: ____________________
Fecha: ____________________

**Resultado:**
- [ ] ✅ MVP READY — todos los críticos pasan, beta cerrada arranca
- [ ] ⚠️ MVP CONDITIONAL — algunos no-críticos pendientes, beta cerrada con riesgo documentado
- [ ] ❌ MVP NOT READY — críticos fallan, no launch

**Items críticos pendientes (si MVP NOT READY):**

```
1. ___
2. ___
3. ___
```

**Items no-críticos diferidos a v1 (si MVP CONDITIONAL):**

```
1. ___
2. ___
```

---

## Apéndice A — Definiciones

**Tenant:** restaurante registrado en FudiMenu. 1 tenant = 1 menú principal + N sucursales (futuro).

**Membership:** relación usuario↔tenant con rol owner/admin/staff.

**MVP Ready:** todos los críticos (🔴) marcados ✅, no más de 2 alto (🟡) pendientes.

**Beta cerrada:** 20 tenants invitados con soporte 1:1, plan Pro gratis 6 meses.

**Beta pública:** waitlist abierta, signups graduales, métricas conversión validadas.

**GA:** lanzamiento público, Product Hunt, marketing activo.

---

## Apéndice B — Comando Audit Rápido

```bash
# Ejecutar desde raíz del proyecto
pnpm typecheck && \
pnpm lint && \
pnpm test --run && \
pnpm build && \
echo "✅ Build pipeline pasa" || echo "❌ Falla en build pipeline"

# E2E (requiere DB de test seedeada)
pnpm test:e2e && echo "✅ E2E pasa" || echo "❌ E2E falla"

# Lighthouse local
pnpm build && pnpm start &
sleep 5
npx @lhci/cli@0.13.x autorun
```

Si todo verde, marcar Audit 1 ✅ y proceder a Audit 2-8 manuales.

---

**Última revisión documento:** 2026-05-08
**Próxima revisión:** post-beta cerrada (semana 6) o cuando scope cambie
