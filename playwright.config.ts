import { defineConfig, devices } from '@playwright/test'

import { createTestEnv } from './tests/setup/env'

const port = 3101
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: `pnpm exec nuxt dev --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ...createTestEnv({
        NUXT_PUBLIC_SITE_URL: baseURL,
        NUXT_TEST_API_MOCKS: 'true',
        NUXT_TEST_AUTH_BYPASS: 'true'
      })
    }
  }
})
