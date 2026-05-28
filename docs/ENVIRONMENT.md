# Environment variables

Last validated: 2026-05-27.

This document lists the real environment variables required by the application.
Do not hardcode secret values in source code, docs, or tracked `.env` files.
Store secrets in `.env.local` for local development and in Vercel Project
Settings for deployed environments.

## Required variables

| Area | Variable | Required for | Expected format |
|---|---|---|---|
| Supabase | `DATABASE_URL` | Prisma Client runtime | `postgresql://...` pooled URL, usually port `6543` in production |
| Supabase | `DIRECT_URL` | Prisma migrations and maintenance scripts | `postgresql://...` direct URL, usually port `5432` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL` | Supabase browser/server clients | `https://<project-ref>.supabase.co` |
| Supabase | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase browser/server clients | Supabase anon/publishable key |
| Supabase | `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin jobs and billing sync | Supabase service role key |
| Stripe | `STRIPE_SECRET_KEY` | Checkout, webhooks, billing service | `sk_test_...` or `sk_live_...` |
| Stripe | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | `whsec_...` |
| Stripe | `STRIPE_PRICE_PRO` | 14-day Pro trial flow | Stripe Price ID, `price_...` |
| Stripe | `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly checkout card | Stripe Price ID, `price_...` |
| Stripe | `STRIPE_PRICE_PRO_ANNUAL` | Pro annual checkout card | Stripe Price ID, `price_...` |
| Stripe | `STRIPE_PRICE_BUSINESS_MONTHLY` | Business monthly checkout card | Stripe Price ID, `price_...` |
| Stripe | `STRIPE_PRICE_BUSINESS_ANNUAL` | Business annual checkout card | Stripe Price ID, `price_...` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Upload signature endpoint and client config | Cloudinary cloud name |
| Cloudinary | `CLOUDINARY_API_KEY` | Signed upload endpoint | Numeric Cloudinary API key |
| Cloudinary | `CLOUDINARY_API_SECRET` | Signed upload endpoint | Cloudinary API secret |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY` | Client and server analytics | `phc_...` |
| PostHog | `NEXT_PUBLIC_POSTHOG_HOST` | Client and server analytics host | `https://...`, defaults to PostHog US in `.env.example` |
| PostHog | `POSTHOG_PERSONAL_API_KEY` | Server-side Stats page queries | Personal API key with `query:read` scope |
| PostHog | `POSTHOG_PROJECT_ID` | Server-side Stats page queries | Numeric PostHog project ID |
| PostHog | `POSTHOG_API_HOST` | Server-side Stats page queries | PostHog app host, e.g. `https://us.posthog.com` |
| Sentry | `SENTRY_DSN` | Server-side Sentry reporting | Sentry DSN URL |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` | Browser and edge Sentry reporting | Sentry DSN URL |
| Sentry | `SENTRY_ORG` | Optional source map upload org | Sentry org slug |
| Sentry | `SENTRY_PROJECT` | Optional source map upload project | Sentry project slug |
| Resend | `RESEND_API_KEY` | Billing and daily-special emails | `re_...` |
| Resend | `RESEND_FROM` | Optional sender identity override | `Name <email@domain>` |
| Resend | `DEV_EMAIL_OVERRIDE` | Optional local/dev redirect for outbound mail | Email address; do not set in production |
| Upstash | `UPSTASH_REDIS_REST_URL` | Rate limiting and view tracking | `https://...` REST URL |
| Upstash | `UPSTASH_REDIS_REST_TOKEN` | Rate limiting and view tracking | Upstash REST token |
| Cron | `CRON_SECRET` | Protects `/api/cron/*` endpoints | Random secret, at least 32 bytes |
| App | `NEXT_PUBLIC_APP_URL` | Auth redirects, QR/referral URLs, checkout redirects | Canonical app URL without a trailing slash |
| App | `USE_MOCKS` | Selects mock vs real service mode | `false` in production and real-service validation |
| App | `SKIP_ENV_VALIDATION` | Optional emergency bypass for local scripts | Leave unset for builds and deployments |

## Public vs server-only

Variables prefixed with `NEXT_PUBLIC_` are bundled into client code and must
never contain secrets. All other variables above are server-only and should be
stored as encrypted/sensitive values in Vercel.

## Validation result

Validated against `.env.local` plus `.env` on 2026-05-27 without printing secret
values.

| Status | Variables |
|---|---|
| Present and format-valid locally | `DIRECT_URL` after `$DATABASE_URL` expansion, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_ANNUAL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_PERSONAL_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `USE_MOCKS` |
| Present locally but not usable | `DATABASE_URL` / `DIRECT_URL` currently point to `USER@localhost:5432/fudimenu_test`; Prisma fails with database access denied. `SUPABASE_SERVICE_ROLE_KEY` is present but Supabase Auth returns `401 Invalid API key`. |
| Missing locally | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Service permission caveats | Cloudinary credentials are present but the key cannot read `/usage` (`403 missing permissions`). Resend key is restricted to sending email and cannot read `/domains` (`401 restricted_api_key`), which is acceptable only if send-email flows pass. |

Vercel validation for the linked project `fudimenu` shows the required
variables above configured for `Production` and `Preview`, except Upstash.
No variables are currently scoped to `Development`, so `vercel dev` and
`vercel env pull --environment=development` will not reproduce the deployed
configuration until Development values are added. `USE_MOCKS=false` is
configured for both Vercel deployed environments.

## Local validation command

Use this command to check presence without printing values:

```bash
node scripts/validate-env.mjs
```
