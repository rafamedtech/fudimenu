import { defineVitestConfig } from '@nuxt/test-utils/config'

import { integrationCoverage } from './tests/config/coverage'
import { applyTestEnv } from './tests/setup/env'

applyTestEnv({
  NUXT_TEST_API_MOCKS: 'true'
})

export default defineVitestConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['tests/integration/**/*.spec.ts'],
    setupFiles: ['./tests/setup/integration.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
    coverage: integrationCoverage
  }
})
