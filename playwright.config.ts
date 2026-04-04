import { defineConfig, devices } from '@playwright/test'

import { createTestEnv } from './tests/setup/env'

const port = 3101
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}',
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
      scale: 'css',
      stylePath: './tests/setup/playwright-visual.css'
    },
    toMatchAriaSnapshot: {
      pathTemplate: '{testDir}/__snapshots__/{projectName}/{testFilePath}/{arg}{ext}',
      children: 'deep-equal'
    }
  },
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    colorScheme: 'light',
    locale: 'es-MX',
    timezoneId: 'America/Tijuana',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: ['**/*.visual.spec.ts', '**/*.aria.spec.ts'],
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'ui-desktop',
      testMatch: ['**/*.visual.spec.ts', '**/*.aria.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1440,
          height: 1200
        }
      }
    },
    {
      name: 'ui-mobile',
      testMatch: ['**/*.visual.spec.ts', '**/*.aria.spec.ts'],
      use: {
        browserName: 'chromium',
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
        viewport: {
          width: 390,
          height: 844
        }
      }
    }
  ],
  webServer: {
    command: `pnpm exec nuxt build && pnpm exec nuxt preview --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      ...createTestEnv({
        NUXT_PUBLIC_SITE_URL: baseURL,
        NUXT_TEST_API_MOCKS: 'true',
        NUXT_TEST_AUTH_BYPASS: 'true'
      }),
      HOST: '127.0.0.1',
      PORT: String(port),
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port)
    }
  }
})
