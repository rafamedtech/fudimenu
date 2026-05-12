# Security verification runbook

Covers MVP security closure: HSTS, CSP nonce, secret-scan in client bundle, Sentry PII scrub. Use this before promoting a build to production.

## Headers matrix

| Header | Source | Scope |
|--------|--------|-------|
| `Strict-Transport-Security` | `next.config.ts` `headers()` | Prod only (gated by `NODE_ENV === 'production'`) |
| `Content-Security-Policy` (with nonce) | `src/middleware.ts` `buildCsp()` | All envs |
| `X-Content-Type-Options: nosniff` | both | All envs |
| `X-Frame-Options: DENY` | both | All envs |
| `Referrer-Policy: strict-origin-when-cross-origin` | both | All envs |
| `Permissions-Policy: camera=(), microphone=(), geolocation=()` | middleware | All envs |

HSTS value in prod: `max-age=63072000; includeSubDomains; preload` (2 years, preload-eligible per hstspreload.org rules). Local dev does NOT emit HSTS — prevents browser from forcing HTTPS on `http://localhost:3000` after first visit.

## 1. HSTS verification

### Production (curl)

```bash
curl -sI https://app.fudimenu.com | grep -i strict-transport
# expect: strict-transport-security: max-age=63072000; includeSubDomains; preload
```

### Local dev (must NOT be present)

```bash
pnpm dev
curl -sI http://localhost:3000 | grep -i strict-transport || echo "OK: no HSTS in dev"
```

### DevTools

1. Open prod URL in Chrome.
2. DevTools → Network → reload → click the document request → Headers → Response Headers.
3. Confirm `strict-transport-security` line matches above.
4. `chrome://net-internals/#hsts` → "Query domain" → enter prod host → confirm `static_sts_observed` populated after first visit.

## 2. CSP nonce verification

Nonce regenerated per request in `src/middleware.ts:generateNonce()` (16 bytes, base64). Injected into `script-src` and forwarded via request header `x-nonce` for RSC consumption.

### Curl: nonce differs every request

```bash
for i in 1 2 3; do
  curl -sI http://localhost:3000/ | grep -i content-security-policy | grep -oE "nonce-[A-Za-z0-9+/=]+"
done
# expect: 3 different nonce values
```

### DevTools

1. Open any page → Network → document request → Response Headers → copy `Content-Security-Policy`.
2. Confirm `script-src` contains `'nonce-<random>'`.
3. Console: paste a violation test:
   ```js
   const s = document.createElement('script');
   s.textContent = 'window.__pwn=1';
   document.head.appendChild(s);
   ```
   Expect: console reports `Refused to execute inline script because it violates the following Content Security Policy directive`. `window.__pwn` undefined.
4. Reload → confirm nonce in CSP header differs from previous load.

### Inline scripts policy

No `<Script>` or inline `<script>` exists in the app (verified via `grep -rn "next/script\|<script" src/`). If you add one, it MUST receive the nonce:

```tsx
import { headers } from 'next/headers';
const nonce = (await headers()).get('x-nonce') ?? undefined;
<Script id="x" nonce={nonce}>{...}</Script>
```

## 3. Secrets in client bundle

Anything in `process.env.*` without the `NEXT_PUBLIC_` prefix MUST NOT appear in client chunks. Server-only secrets (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `CRON_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, `DIRECT_URL`) must stay server-side.

### Build + grep client chunks

```bash
pnpm build
# Search every JS shipped to the browser for secret env names + literal values.
SECRETS=(STRIPE_SECRET_KEY SUPABASE_SERVICE_ROLE_KEY CLOUDINARY_API_SECRET RESEND_API_KEY CRON_SECRET UPSTASH_REDIS_REST_TOKEN STRIPE_WEBHOOK_SECRET DATABASE_URL DIRECT_URL)
for name in "${SECRETS[@]}"; do
  echo "=== $name ==="
  grep -RIl --include="*.js" "$name" .next/static 2>/dev/null && echo "LEAK: $name found in client bundle" || echo "OK"
done
```

Also grep the actual secret VALUES from `.env.production` against `.next/static`:

```bash
# Replace KEY with literal value from .env.production (don't commit this script).
grep -RIl --include="*.js" "sk_live_" .next/static 2>/dev/null && echo "LEAK: Stripe live key" || echo "OK"
grep -RIl --include="*.js" "service_role" .next/static 2>/dev/null && echo "LEAK: Supabase service role" || echo "OK"
```

Expected: every check prints `OK`. Any `LEAK:` line is a release blocker.

### DevTools spot check

1. Build + start: `pnpm build && pnpm start`.
2. Load any page → DevTools → Sources → expand `.next/static/chunks` → Ctrl+F across all loaded files for substrings: `sk_live_`, `service_role`, `STRIPE_SECRET`, `SUPABASE_SERVICE_ROLE`.
3. Zero matches required.

### CI hook (optional)

Add to CI after `pnpm build`:

```bash
if grep -RIl --include="*.js" -E "(STRIPE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY|CLOUDINARY_API_SECRET)" .next/static; then
  echo "Secret name leaked to client bundle"; exit 1
fi
```

## 4. Sentry PII scrub (do not regress)

`sentry.client.config.ts` strips `user.email` and `user.ip_address` in `beforeSend`. Sentry server/edge configs must remain free of unfiltered PII.

### Verify locally

1. Trigger a client error on a logged-in page (force a throw).
2. Sentry dashboard → Issue → Event Detail → User context.
3. Confirm `email` and `ip_address` are absent. Only Sentry-generated user id may appear.

## 5. Pre-release checklist

- [ ] `curl -sI https://<prod>` shows HSTS with `preload`.
- [ ] `curl -sI http://localhost:3000` shows no HSTS.
- [ ] CSP nonce rotates per request (3 different values in 3 curls).
- [ ] Inline-script injection in DevTools console blocked by CSP.
- [ ] Server-secret grep across `.next/static` returns zero matches.
- [ ] Sentry test event has no email / IP in user context.
- [ ] Headers matrix above matches actual response in prod.
