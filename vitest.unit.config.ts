import { defineVitestConfig } from '@nuxt/test-utils/config'

import { unitCoverage } from './tests/config/coverage'
import { applyTestEnv } from './tests/setup/env'

applyTestEnv()

export default defineVitestConfig({
  test: {
    name: 'unit',
    environment: 'node',
    include: ['tests/unit/**/*.spec.ts'],
    setupFiles: ['./tests/setup/unit.ts'],
    coverage: unitCoverage
  }
})
