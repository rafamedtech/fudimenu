# Environment variables

Last validated: 2026-05-14.

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
| Sentry | `SENTRY_DSN` | Server-side Sentry reporting | Sentry DSN URL |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` | Browser and edge Sentry reporting | Sentry DSN URL |
| Resend | `RESEND_API_KEY` | Billing and daily-special emails | `re_...` |
| Upstash | `UPSTASH_REDIS_REST_URL` | Rate limiting and view tracking | `https://...` REST URL |
| Upstash | `UPSTASH_REDIS_REST_TOKEN` | Rate limiting and view tracking | Upstash REST token |
| Cron | `CRON_SECRET` | Protects `/api/cron/*` endpoints | Random secret, at least 32 bytes |
| App | `NEXT_PUBLIC_APP_URL` | Auth redirects, QR/referral URLs, checkout redirects | Canonical app URL without a trailing slash |

## Public vs server-only

Variables prefixed with `NEXT_PUBLIC_` are bundled into client code and must
never contain secrets. All other variables above are server-only and should be
stored as encrypted/sensitive values in Vercel.

## Validation result

Validated against `.env.local` plus `.env` on 2026-05-14 without printing secret
values.

| Status | Variables |
|---|---|
| Present and format-valid locally | `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` |
| Missing locally | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CRON_SECRET` |
| Present locally but invalid format | `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_ANNUAL` are numeric amounts; the code expects Stripe Price IDs (`price_...`) |

Vercel validation for the linked project `fudimenu` reported no configured
environment variables via `pnpm dlx vercel@latest env ls`. Add every required
variable above to Vercel for the appropriate `production`, `preview`, and
`development` scopes before deploying real traffic.

## Local validation command

Use this command to check presence without printing values:

```bash
node scripts/validate-env.mjs
```
