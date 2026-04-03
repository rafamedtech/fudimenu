import { afterEach, vi } from 'vitest'

import { applyTestEnv } from './env'

applyTestEnv()

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
