# Runbook — Auth + RLS validation (prod)

Marcadores:
- 🟢 **Code** — verificable desde repo o via Supabase MCP.
- 🟡 **External** — dashboard manual, no validable desde código.

Proyecto prod: `FudiMenu` (`qbooexsdeqzptcoinklt`).

---

## 1. Estado actual (post-validación 2026-05-12)

| Item | Estado | Notas |
|---|---|---|
| RLS habilitada en 12 tablas tenant-scoped | 🟢 ✅ | Migración 007 |
| Policies completas (18 totales) | 🟢 ✅ | Migración 008 aplicada |
| `_prisma_migrations` sync con repo (9/9) | 🟢 ✅ | 006a + 008 backfilled |
| GRANTs `anon`/`authenticated` revocados en public | 🟢 ✅ | Defense-in-depth doble |
| Cross-tenant isolation test (5 casos) | 🟢 ✅ | Pasado via DO block rolled back |
| Leaked password protection | 🟡 ❌ | Pendiente, ver §3 |
| Magic Link OTP expiry 3600s | 🟡 ❓ | Ver §4 |
| Site URL = dominio prod | 🟡 ❓ | Ver §4 |
| Redirect allowlist `/auth/callback` | 🟡 ❓ | Ver §4 |
| Google OAuth client + GCP redirect URI | 🟡 ❓ | Ver §5 |

---

## 2. Arquitectura seguridad multi-tenant

**Capas de defensa:**

1. **App layer:** Prisma usa `service_role` (bypass RLS). Custom ESLint rule fuerza `where: { tenantId }` en toda query. `requireAuth()` resuelve tenant activo via `ACTIVE_TENANT_COOKIE`.
2. **Postgres GRANTs:** `anon` y `authenticated` no tienen GRANT alguno en schema `public`. PostgREST nunca expone tablas a clientes con JWT.
3. **Postgres RLS:** Si alguien grant'eara acceso por error, policies filtran por `auth.uid()` → `memberships` → `tenant_id`.

Resultado: app debe fallar por ESLint si olvida `tenantId`; aún si pasa, GRANTs bloquean; aún si grants se abren, RLS filtra.

---

## 3. Enable Leaked Password Protection 🟡

**Path:** Dashboard → Auth → Policies → Password Security.
Toggle **"Check passwords against HaveIBeenPwned"** = ON.

Verificación post-cambio via MCP:
```
get_advisors(project_id="qbooexsdeqzptcoinklt", type="security")
```
`auth_leaked_password_protection` debe desaparecer de `lints`.

---

## 4. Magic Link + URL config 🟡

**Path:** Dashboard → Auth → URL Configuration.

Checklist:
- [ ] **Site URL** = `https://<dominio-prod-final>` (ej `https://fudimenu.com`).
- [ ] **Redirect URLs** incluye:
  - `https://<dominio>/auth/callback`
  - `https://*.<dominio>/auth/callback` (si subdominios por tenant)
  - `http://localhost:3000/auth/callback` (dev)
- [ ] **Path:** Auth → Providers → Email → **OTP Expiry** = `3600` (1 hora).
- [ ] **Secure email change** = ON.
- [ ] Single-use ya built-in (`verifyOtp` consume token, no toggle).

Verificación end-to-end manual:
1. Solicitar magic link en `https://<dominio>/login`.
2. Click → redirige a `/auth/callback?code=...` → sesión creada.
3. Reutilizar mismo link → debe fallar ("invalid or expired").
4. Solicitar otro, esperar >1h, intentar → debe fallar.

---

## 5. Google OAuth 🟡

**Path:** Dashboard → Auth → Providers → Google.

Checklist:
- [ ] **Enabled** = true
- [ ] **Client ID** + **Client Secret** seteados (no placeholder)
- [ ] **GCP Console → APIs & Credentials → OAuth 2.0 Client → Authorized redirect URIs** incluye:
  `https://qbooexsdeqzptcoinklt.supabase.co/auth/v1/callback`
- [ ] **GCP → Authorized JavaScript origins** incluye dominio prod
- [ ] OAuth consent screen publicado (no en testing si beta pública)

Verificación E2E:
1. `/login` → "Continuar con Google" → flow GCP → callback Supabase → app `/auth/callback` → sesión.
2. Cookie `sb-<ref>-auth-token` presente.

---

## 6. Validar RLS policies via MCP (one-shot)

```sql
-- Conteo policies por tabla (esperado: 18 totales)
SELECT tablename, count(*) FROM pg_policies WHERE schemaname='public' GROUP BY tablename ORDER BY tablename;

-- Lista completa con quals
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;

-- Tablas con RLS enabled (esperado: 12)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=true ORDER BY tablename;
```

Drift detection:
```bash
# Repo expected counts
grep -c "CREATE POLICY" prisma/migrations/00{7,8}*/migration.sql
# Should equal pg_policies count en prod
```

---

## 7. Cross-tenant isolation E2E test (idempotente, rolled back)

Para correr ad-hoc en prod sin dejar huella, usar el siguiente DO block (todo se revierte vía `ROLLBACK`):

<details>
<summary>SQL test bloque (click)</summary>

```sql
BEGIN;

-- Grants temporales para que role authenticated pueda intentar queries
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items, public.tenants, public.memberships TO authenticated;
GRANT SELECT ON public.menu_items, public.tenants, public.memberships TO anon;

DO $$
DECLARE
  v_tenant_a uuid;
  v_tenant_b uuid;
  v_user_a uuid := gen_random_uuid();
  v_user_b uuid := gen_random_uuid();
  v_count int;
  v_visible_name text;
BEGIN
  INSERT INTO public.tenants(slug, name) VALUES ('rls-isol-a-' || substr(md5(random()::text),1,8), 'RLS Isol A') RETURNING id INTO v_tenant_a;
  INSERT INTO public.tenants(slug, name) VALUES ('rls-isol-b-' || substr(md5(random()::text),1,8), 'RLS Isol B') RETURNING id INTO v_tenant_b;
  INSERT INTO public.memberships(tenant_id, user_id, role) VALUES (v_tenant_a, v_user_a, 'owner'::public."MembershipRole");
  INSERT INTO public.memberships(tenant_id, user_id, role) VALUES (v_tenant_b, v_user_b, 'owner'::public."MembershipRole");
  INSERT INTO public.menu_items(tenant_id, name, price_cents) VALUES (v_tenant_a, 'ItemA-secret', 1000);
  INSERT INTO public.menu_items(tenant_id, name, price_cents) VALUES (v_tenant_b, 'ItemB-secret', 2000);

  -- T1: user_a sees only ItemA
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*), max(name) INTO v_count, v_visible_name FROM public.menu_items WHERE name IN ('ItemA-secret','ItemB-secret');
  IF v_count <> 1 OR v_visible_name <> 'ItemA-secret' THEN RAISE EXCEPTION 'T1 FAIL'; END IF;

  -- T2: user_a cannot see tenant_b
  SELECT count(*) INTO v_count FROM public.tenants WHERE id = v_tenant_b;
  IF v_count <> 0 THEN RAISE EXCEPTION 'T2 FAIL'; END IF;

  RESET ROLE;

  -- T3: user_b sees only ItemB
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*), max(name) INTO v_count, v_visible_name FROM public.menu_items WHERE name IN ('ItemA-secret','ItemB-secret');
  IF v_count <> 1 OR v_visible_name <> 'ItemB-secret' THEN RAISE EXCEPTION 'T3 FAIL'; END IF;
  RESET ROLE;

  -- T4: anon sees nothing
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL ROLE anon;
  SELECT count(*) INTO v_count FROM public.menu_items WHERE name IN ('ItemA-secret','ItemB-secret');
  IF v_count <> 0 THEN RAISE EXCEPTION 'T4 FAIL'; END IF;
  RESET ROLE;

  -- T5: user_a UPDATE on tenant_b row affects 0 rows
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_a::text, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  WITH u AS (UPDATE public.menu_items SET price_cents = 9999 WHERE name = 'ItemB-secret' RETURNING 1)
  SELECT count(*) INTO v_count FROM u;
  IF v_count <> 0 THEN RAISE EXCEPTION 'T5 FAIL'; END IF;
  RESET ROLE;

  RAISE NOTICE 'ALL RLS TESTS PASSED';
END $$;

ROLLBACK;
```

</details>

**Resultado esperado:** sin errores. Cualquier `RAISE EXCEPTION` aborta y revierte. `ROLLBACK` final garantiza cero huellas.

---

## 8. Sync `_prisma_migrations` post-out-of-band changes

Si futuras migraciones se aplican via MCP (no via `prisma migrate deploy`), backfill manual:

```sql
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  '<sha256-of-migration.sql>',
  now(),
  '<NNN_migration_name>',
  NULL, NULL, now(), 0
);
```

Obtener checksum:
```bash
sha256sum prisma/migrations/NNN_*/migration.sql
```

**Preferido:** correr `prisma migrate deploy` con `DATABASE_URL=$PROD_DIRECT_URL` en lugar de aplicar DDL ad-hoc. Esto mantiene `_prisma_migrations` autoritativo.

---

## 9. Quick advisor health-check

```
get_advisors(project_id="qbooexsdeqzptcoinklt", type="security")
get_advisors(project_id="qbooexsdeqzptcoinklt", type="performance")
```

Correr post cada cambio DDL. Target: cero lints level=ERROR o WARN.
