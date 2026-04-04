import { playwright } from '@vitest/browser-playwright'
import { defineVitestConfig } from '@nuxt/test-utils/config'

import { applyTestEnv } from './tests/setup/env'

applyTestEnv({
  NUXT_TEST_API_MOCKS: 'true',
  NUXT_TEST_AUTH_BYPASS: 'true'
})

export default defineVitestConfig({
  test: {
    name: 'components',
    environment: 'nuxt',
    include: ['tests/components/**/*.spec.ts'],
    setupFiles: ['./tests/setup/components.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          headless: true
        },
        contextOptions: {
          viewport: {
            width: 430,
            height: 932
          }
        }
      }),
      instances: [
        {
          browser: 'chromium'
        }
      ]
    }
  }
})
