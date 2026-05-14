import fs from 'node:fs';
import dotenv from 'dotenv';

const files = ['.env', '.env.local'];
const env = {};

for (const file of files) {
  if (fs.existsSync(file)) {
    Object.assign(env, dotenv.parse(fs.readFileSync(file)));
  }
}

const required = {
  Supabase: [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  Stripe: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PRO',
    'STRIPE_PRICE_PRO_MONTHLY',
    'STRIPE_PRICE_PRO_ANNUAL',
    'STRIPE_PRICE_BUSINESS_MONTHLY',
    'STRIPE_PRICE_BUSINESS_ANNUAL',
  ],
  Cloudinary: [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ],
  PostHog: ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
  Sentry: ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'],
  Resend: ['RESEND_API_KEY'],
  Upstash: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  Cron: ['CRON_SECRET'],
  App: ['NEXT_PUBLIC_APP_URL'],
};

const validators = {
  DATABASE_URL: (value) => /^postgres(ql)?:\/\//.test(value),
  DIRECT_URL: (value) => /^postgres(ql)?:\/\//.test(value),
  NEXT_PUBLIC_SUPABASE_URL: (value) => /^https:\/\/.+\.supabase\.co$/.test(value),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: (value) => value.length > 20,
  SUPABASE_SERVICE_ROLE_KEY: (value) => value.length > 20,
  STRIPE_SECRET_KEY: (value) => /^sk_(test|live)_/.test(value),
  STRIPE_WEBHOOK_SECRET: (value) => /^whsec_/.test(value),
  STRIPE_PRICE_PRO: (value) => /^price_/.test(value),
  STRIPE_PRICE_PRO_MONTHLY: (value) => /^price_/.test(value),
  STRIPE_PRICE_PRO_ANNUAL: (value) => /^price_/.test(value),
  STRIPE_PRICE_BUSINESS_MONTHLY: (value) => /^price_/.test(value),
  STRIPE_PRICE_BUSINESS_ANNUAL: (value) => /^price_/.test(value),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: (value) => /^[A-Za-z0-9_-]+$/.test(value),
  CLOUDINARY_API_KEY: (value) => /^\d+$/.test(value),
  CLOUDINARY_API_SECRET: (value) => value.length > 10,
  NEXT_PUBLIC_POSTHOG_KEY: (value) => /^phc_/.test(value),
  NEXT_PUBLIC_POSTHOG_HOST: (value) => /^https?:\/\//.test(value),
  SENTRY_DSN: (value) => /^https:\/\//.test(value),
  NEXT_PUBLIC_SENTRY_DSN: (value) => /^https:\/\//.test(value),
  RESEND_API_KEY: (value) => /^re_/.test(value),
  UPSTASH_REDIS_REST_URL: (value) => /^https:\/\//.test(value),
  UPSTASH_REDIS_REST_TOKEN: (value) => value.length > 20,
  CRON_SECRET: (value) => value.length >= 32,
  NEXT_PUBLIC_APP_URL: (value) => /^https?:\/\//.test(value),
};

let hasIssue = false;

for (const [group, keys] of Object.entries(required)) {
  console.log(`[${group}]`);

  for (const key of keys) {
    const value = env[key]?.trim() ?? '';
    const present = value.length > 0;
    const valid = present && (!validators[key] || validators[key](value));

    if (!present || !valid) {
      hasIssue = true;
    }

    const status = !present ? 'MISSING' : valid ? 'present/valid' : 'present/INVALID_FORMAT';
    console.log(`${key}: ${status}`);
  }
}

process.exitCode = hasIssue ? 1 : 0;
