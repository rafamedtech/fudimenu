# Runbook MVP — Operación

Marcadores:
- 🟢 **Code** — verificable desde repo.
- 🟡 **External** — dashboard de terceros / config manual. No validable desde codigo.

---

## 1. Variables por ambiente

🟢 Referencia: `.env.example`, `CLAUDE.md` § "Env vars críticas".

| Var | dev | preview | prod |
|---|---|---|---|
| `USE_MOCKS` | `true` (default) | `false` | `false` |
| `DATABASE_URL` | local pg / Supabase test | Supabase preview branch | Supabase prod (pooled, 6543) |
| `DIRECT_URL` | local | Supabase preview direct (5432) | Supabase prod direct (5432, migraciones) |
| `NEXT_PUBLIC_SUPABASE_URL` | test proj | preview proj | prod proj |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | test | preview | prod |
| `SUPABASE_SERVICE_ROLE_KEY` | test | preview | prod (server only) |
| `STRIPE_SECRET_KEY` | `sk_test_*` | `sk_test_*` | `sk_live_*` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_*` test endpoint | test | live endpoint |
| `STRIPE_PRICE_PRO` | test price | test | live price (trial 14d) |
| `STRIPE_PRICE_PRO_MONTHLY/ANNUAL` | test | test | live |
| `STRIPE_PRICE_BUSINESS_MONTHLY/ANNUAL` | test | test | live |
| `CLOUDINARY_*` | dev cloud | dev cloud | prod cloud |
| `RESEND_API_KEY` | test domain | test | prod domain verificado |
| `NEXT_PUBLIC_POSTHOG_KEY/HOST` | dev project | dev | prod project |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | dev env | preview env | prod env |
| `UPSTASH_REDIS_REST_URL/TOKEN` | dev db | preview db | prod db |
| `CRON_SECRET` | random | random | random fuerte (≥32 bytes) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://preview-*.vercel.app` | `https://fudimenu.com` |

🟡 Set vars en **Vercel → Project → Settings → Environment Variables**. Marcar production/preview/development.

🟡 Rotación secretos cada 90d: Supabase service role, Stripe restricted keys, Resend, Upstash, CRON_SECRET.

---

## 2. Deploy

🟢 Pipeline:
1. PR → CI (typecheck, lint, test, build).
2. Merge a `main` → 🟡 Vercel auto-deploy production.
3. Preview por PR → 🟡 Vercel preview env auto.

Comandos previos a deploy (local sanity):
```
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```

Tras deploy:
- 🟡 Verificar `/api/health` (si existe) o smoke: `GET /` 200, `/m/<slug-demo>` <1s LCP.
- 🟡 Sentry release: confirmar release tag creado.
- 🟡 PostHog: deploy event registrado (annotation).

---

## 3. Migraciones — `migrate deploy`

🟢 Regla CLAUDE.md: prod usa `prisma migrate deploy`, **nunca** `db push`.

Flujo:
```
# Desarrollo
pnpm db:migrate:dev   # crea migration + aplica

# Producción (CI step o manual)
pnpm prisma migrate deploy
```

Pre-deploy migration check:
1. Branch DB en Supabase (🟡 dashboard → Branching) o copia local con `pg_dump`.
2. Correr `prisma migrate deploy` contra branch.
3. Validar `prisma migrate status` = up to date.
4. Validar RLS policies aún presentes (`select * from pg_policies`).

Migration destructiva (drop col / rename):
- Patrón expand → migrate → contract en 2 deploys.
- Deploy 1: add nuevo, dual-write.
- Deploy 2 (≥24h después): drop viejo.

🟡 Si migration falla en prod: `prisma migrate resolve --rolled-back <name>`, fix, redeploy.

---

## 4. Rollback

🟢 Code rollback:
- 🟡 Vercel → Deployments → seleccionar deployment previo → **Promote to Production**.
- O `git revert <sha> && git push` → auto-deploy.

🟢 Migration rollback:
- Sin auto-rollback. Crear migration inversa nueva, **no** editar la anterior.
- Si data perdida: restaurar PITR (§5).

Decisión:
- Bug código sin data corrupta → promote previous deploy.
- Schema break → revert + migration inversa.
- Data corrupta → PITR restore.

---

## 5. PITR — Point-in-Time Recovery

🟡 Supabase Pro plan. Retention 7 días.

Trigger: data corruption, drop accidental, breach.

Pasos:
1. 🟡 Supabase Dashboard → Database → Backups → Point in time.
2. Elegir timestamp (UTC) antes del incidente.
3. Restore crea nuevo proyecto/branch (Supabase no overwrite directo).
4. Comparar diffs (filas afectadas) con `pg_dump` + diff.
5. Cutover:
   - Maintenance mode (🟡 status page + feature flag global).
   - Repointar `DATABASE_URL`/`DIRECT_URL` a restored DB en Vercel.
   - Redeploy.
6. Postmortem obligatorio.

RTO objetivo: **<2h**. RPO: **<5min** (PITR granularidad).

---

## 6. Restore drill

Cadencia: **trimestral**.

Pasos:
1. 🟡 Crear branch Supabase desde snapshot reciente.
2. Apuntar staging local a branch: `DATABASE_URL=<branch_url>`.
3. Correr `pnpm prisma migrate status` → up to date.
4. Verificación funcional:
   - Login magic link.
   - Crear item, toggle stock, comensal `/m/[slug]` render.
   - Stripe webhook simulado (Stripe CLI `stripe trigger checkout.session.completed`).
5. Cronometrar restore end-to-end. Documentar tiempo en `docs/drills/<fecha>.md`.
6. Destroy branch.

Falla drill → bloquear release siguiente hasta resolver.

---

## 7. Status page

🟡 Externo. Opciones MVP: [statuspage.io](https://statuspage.io), [betterstack.com](https://betterstack.com), o página estática propia (`status.fudimenu.com`).

Componentes a publicar:
- API (Vercel)
- DB (Supabase)
- Auth (Supabase)
- Pagos (Stripe)
- Imágenes (Cloudinary)
- Email (Resend)

Niveles: Operational / Degraded / Partial outage / Major outage.

Updates obligatorios:
- Reconocer incidente <15min.
- Update cada 30min.
- Postmortem público <72h tras resolución.

---

## 8. Alertas Sentry P0

🟢 Sentry SDK ya en repo (DSN env). 🟡 Reglas en dashboard Sentry.

P0 = page on-call inmediato:
- Error rate >2% en ventana 5min en rutas: `/m/[slug]`, `/api/webhooks/stripe`, `/api/cron/*`, server actions de billing.
- Cualquier `error.name = "PrismaClientInitializationError"` (DB down).
- Cualquier evento con tag `severity:critical`.
- Webhook Stripe firma inválida >5 en 10min (posible ataque).
- Spike >10× baseline en 1min.

Canales: 🟡 PagerDuty / Slack `#alerts-p0` / SMS on-call.

P1 (Slack only):
- Error rate >0.5% sostenido 15min.
- Rate limit 429 spike.
- Migration error en cron.

P2 (digest diario):
- Warnings, deprecations, performance regressions.

🟡 Configurar **Issue Owners** por path para routear a equipo correcto.

---

## 9. PostHog funnel

🟡 Definir en PostHog UI. Eventos ya emitidos desde código (verificar con grep `posthog.capture`).

Funnel **Activación tenant**:
1. `signup_completed`
2. `onboarding_started`
3. `tenant_created`
4. `first_item_created`
5. `menu_published` (slug live)
6. `qr_downloaded`
7. `first_comensal_view` (público `/m/[slug]`)

Funnel **Conversión Pro**:
1. `paywall_seen`
2. `checkout_started`
3. `checkout_completed`
4. `trial_started`
5. `subscription_active`

Funnel **Comensal**:
1. `menu_view` (`/m/[slug]`)
2. `category_select`
3. `item_view`
4. `whatsapp_click` / `call_click`

🟡 Alertas PostHog: drop >20% step-over-step día sobre día → Slack `#growth`.

🟡 Retention cohort: weekly active tenants (≥1 admin action en últimos 7d).

---

## 10. Stripe webhook runbook

🟢 Endpoint: `src/app/api/webhooks/stripe/route.ts`. Idempotencia vía tabla `webhookEvent`.

Eventos manejados (verificar contra código):
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `charge.succeeded` (OXXO/SPEI async)

Setup inicial:
1. 🟡 Stripe Dashboard → Webhooks → Add endpoint.
2. URL: `https://<domain>/api/webhooks/stripe`.
3. Suscribir solo eventos arriba (no "all events").
4. Copiar signing secret → `STRIPE_WEBHOOK_SECRET` en Vercel prod.
5. Test: `stripe trigger checkout.session.completed`.

Webhook caído / retries pendientes:
1. 🟡 Stripe Dashboard → Webhooks → endpoint → ver "Failed".
2. Confirmar status code y body de respuesta.
3. Si bug código: fix + deploy. Reintentar manualmente desde dashboard (botón **Resend**).
4. Idempotencia (`webhookEvent.eventId` unique) protege duplicados.

Firma inválida:
- Revisar `STRIPE_WEBHOOK_SECRET` matchea endpoint live (no test).
- Verificar request raw body no mutado (Next 15 App Router: `await req.text()`).

OXXO/SPEI async:
- `checkout.session.completed` llega con `payment_status: 'unpaid'`. **No** activar plan.
- Esperar `charge.succeeded` (puede tomar hasta 48h).
- Si no llega en 72h: `charge.expired` → notificar user.

🟡 Monitor Stripe Dashboard → Developers → Events: error rate <0.1%.

---

## 11. Checklist manual de lanzamiento

### T-7 días
- [ ] 🟢 `pnpm typecheck && pnpm lint && pnpm test --run && pnpm test:e2e` verdes en CI.
- [ ] 🟢 Lighthouse CI: `/m/[slug]` perf ≥90, LCP <1s.
- [ ] 🟢 Bundle baseline check (CLAUDE.md valores).
- [ ] 🟡 Restore drill ejecutado <30d.
- [ ] 🟡 Secrets rotation log al día.
- [ ] 🟢 Migración prod plan revisado (`prisma migrate diff`).
- [ ] 🟡 Backups Supabase PITR habilitado.
- [ ] 🟡 Status page componentes creados.
- [ ] 🟡 Sentry alertas P0/P1 configuradas.
- [ ] 🟡 PostHog funnels publicados.
- [ ] 🟡 Stripe live mode webhook endpoint creado + signing secret en Vercel.
- [ ] 🟡 Stripe productos + prices live creados, IDs en env vars.
- [ ] 🟡 Resend dominio verificado (SPF/DKIM/DMARC).
- [ ] 🟡 Cloudinary upload preset firmado (no unsigned).
- [ ] 🟡 Domain DNS apuntado a Vercel (A/CNAME + TXT verification).
- [ ] 🟡 SSL cert emitido (Vercel auto).

### T-1 día
- [ ] 🟢 `git log` revisión cambios desde último deploy.
- [ ] 🟡 Freeze merges no críticos.
- [ ] 🟡 On-call rotation confirmada.
- [ ] 🟡 Comms preparados (Twitter, email, status page draft).

### T-0 (lanzamiento)
- [ ] 🟢 Deploy `main` → prod.
- [ ] 🟢 `prisma migrate deploy` ok.
- [ ] 🟡 Smoke test prod:
  - [ ] Signup magic link end-to-end.
  - [ ] Crear tenant + onboarding completo.
  - [ ] Crear item con imagen Cloudinary.
  - [ ] Publicar menú, abrir `/m/[slug]` en mobile real.
  - [ ] Generar QR + descargar.
  - [ ] Stripe checkout card (test card en live mode con monto chico, refund).
  - [ ] WhatsApp click tracking aparece en PostHog.
- [ ] 🟡 Sentry: 0 issues nuevos en 30min post-deploy.
- [ ] 🟡 Status page → Operational.
- [ ] 🟡 Anuncio publicado.

### T+1 día
- [ ] 🟡 Revisar PostHog funnels (drop-off, conversión).
- [ ] 🟡 Sentry error budget consumido <10%.
- [ ] 🟡 Stripe webhook success rate >99.9%.
- [ ] 🟡 Supabase pool usage <70%.
- [ ] 🟡 Vercel function duration p95 dentro de budget.

### T+7 días
- [ ] 🟡 Postmortem si hubo incidentes.
- [ ] 🟡 Retro lanzamiento.
- [ ] 🟡 Restore drill agendado próximo trimestre.

---

## Apéndice — Items 🟡 no validables desde código

Para auditar manualmente cada release:

1. Vercel env vars set en production scope.
2. Supabase PITR habilitado + retention 7d.
3. Supabase RLS policies activas (verificar en SQL editor, no solo en migration files).
4. Stripe webhook endpoint live activo + eventos correctos suscritos.
5. Stripe products/prices live IDs matchean env vars.
6. Resend domain verification status = verified.
7. Cloudinary signed upload (no unsigned preset).
8. DNS records + SSL.
9. Sentry alert rules + notification channels.
10. PostHog funnels + alerts.
11. Status page components + integraciones.
12. On-call schedule + escalation policy.
13. Secrets rotation cadence.
14. Backup verification (último restore drill <90d).
