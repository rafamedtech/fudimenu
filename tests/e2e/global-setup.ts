import { execSync } from 'node:child_process';

function assertSafeDatabase() {
  const url = process.env.DATABASE_URL ?? '';

  // Require DATABASE_URL to be set for E2E (USE_MOCKS=false in playwright.config.ts)
  if (!url) {
    throw new Error(
      '[E2E] DATABASE_URL is not set. E2E tests require a real database.\n' +
        'Set DATABASE_URL to a local or dedicated test Supabase project.',
    );
  }

  const isSafe =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('local') ||
    url.includes('test') ||
    url.includes('ci');

  if (!isSafe) {
    throw new Error(
      '[E2E] DATABASE_URL does not look like a local/test database.\n' +
        'E2E runs pnpm db:push --force-reset which DROPS ALL DATA.\n' +
        'Use a dedicated test Supabase project whose URL contains "local", "test", or "ci".\n' +
        `Current DATABASE_URL host: ${new URL(url).hostname}`,
    );
  }
}

export default async function globalSetup() {
  assertSafeDatabase();
  execSync('pnpm db:push --force-reset', { stdio: 'inherit' });
  execSync('pnpm db:seed', { stdio: 'inherit' });
}
