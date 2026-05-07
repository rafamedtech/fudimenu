import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  globalSetup: './tests/e2e/global-setup.ts',
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3102',
    trace: 'on-first-retry',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'pnpm exec next dev --turbo --hostname 127.0.0.1 --port 3102',
        env: {
          ...process.env,
          E2E_TEST_AUTH: 'true',
          E2E_STRIPE_CHECKOUT_MOCK: 'true',
          NEXT_PUBLIC_APP_URL: 'http://127.0.0.1:3102',
          STRIPE_SECRET_KEY: 'sk_test_e2e_mock',
          USE_MOCKS: 'false',
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: 'http://127.0.0.1:3102',
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
