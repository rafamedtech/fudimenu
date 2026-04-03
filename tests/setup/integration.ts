import { afterEach, vi } from 'vitest'

import { applyTestEnv } from './env'

applyTestEnv({
  NUXT_TEST_API_MOCKS: 'true'
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
