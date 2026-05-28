import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const usesRealServices = process.env.USE_MOCKS === 'false' || isProduction;

function serviceString(schema: z.ZodString = z.string()) {
  return usesRealServices ? schema.min(1) : schema.optional();
}

function serviceUrl() {
  return serviceString(z.string().url());
}

export const env = createEnv({
  server: {
    DATABASE_URL: serviceUrl(),
    DIRECT_URL: serviceUrl(),
    SUPABASE_SERVICE_ROLE_KEY: serviceString(),
    CLOUDINARY_API_KEY: serviceString(z.string().regex(/^\d+$/)),
    CLOUDINARY_API_SECRET: serviceString(),
    STRIPE_SECRET_KEY: serviceString(z.string().regex(/^sk_(test|live)_/)),
    // Trial price ID used when starting 14-day Pro trial (billing.service.ts)
    STRIPE_PRICE_PRO: serviceString(z.string().regex(/^price_/)),
    // Monthly/annual subscription price IDs used in checkout (billing.actions.ts)
    STRIPE_PRICE_PRO_MONTHLY: serviceString(z.string().regex(/^price_/)),
    STRIPE_PRICE_PRO_ANNUAL: serviceString(z.string().regex(/^price_/)),
    STRIPE_PRICE_BUSINESS_MONTHLY: serviceString(z.string().regex(/^price_/)),
    STRIPE_PRICE_BUSINESS_ANNUAL: serviceString(z.string().regex(/^price_/)),
    STRIPE_WEBHOOK_SECRET: serviceString(z.string().regex(/^whsec_/)),
    RESEND_API_KEY: serviceString(z.string().regex(/^re_/)),
    RESEND_FROM: z.string().optional(),
    DEV_EMAIL_OVERRIDE: z.string().email().optional(),
    POSTHOG_PERSONAL_API_KEY: serviceString(),
    POSTHOG_PROJECT_ID: serviceString(),
    POSTHOG_API_HOST: serviceUrl(),
    SENTRY_DSN: serviceUrl(),
    SENTRY_ORG: z.string().optional(),
    SENTRY_PROJECT: z.string().optional(),
    CRON_SECRET: serviceString(z.string().min(32)),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(20).optional(),
    USE_MOCKS: isProduction ? z.literal('false') : z.enum(['true', 'false']).default('true'),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: serviceUrl(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: serviceString(),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: serviceString(z.string().regex(/^[A-Za-z0-9_-]+$/)),
    NEXT_PUBLIC_POSTHOG_KEY: serviceString(z.string().regex(/^phc_/)),
    NEXT_PUBLIC_POSTHOG_HOST: serviceUrl(),
    NEXT_PUBLIC_SENTRY_DSN: serviceUrl(),
    NEXT_PUBLIC_APP_URL: usesRealServices
      ? z.string().url()
      : z.string().url().default('http://localhost:3000'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    STRIPE_PRICE_PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    STRIPE_PRICE_BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    STRIPE_PRICE_BUSINESS_ANNUAL: process.env.STRIPE_PRICE_BUSINESS_ANNUAL,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM,
    DEV_EMAIL_OVERRIDE: process.env.DEV_EMAIL_OVERRIDE,
    POSTHOG_PERSONAL_API_KEY: process.env.POSTHOG_PERSONAL_API_KEY,
    POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID,
    POSTHOG_API_HOST: process.env.POSTHOG_API_HOST,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    CRON_SECRET: process.env.CRON_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    USE_MOCKS: process.env.USE_MOCKS,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
