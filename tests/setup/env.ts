import { fileURLToPath } from 'node:url'

export const testRootDir = fileURLToPath(new URL('../..', import.meta.url))

const baseTestEnv = {
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/fudimenu_test',
  DIRECT_URL: 'postgresql://postgres:postgres@127.0.0.1:5432/fudimenu_test',
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  NUXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3000',
  DEMO_OWNER_EMAIL: 'owner@fudimenu.test',
  NUXT_TEST_AUTH_BYPASS: 'false'
} as const

export function createTestEnv(overrides: Record<string, string> = {}) {
  return {
    ...baseTestEnv,
    ...overrides
  }
}

export function applyTestEnv(overrides: Record<string, string> = {}) {
  const env = createTestEnv(overrides)

  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env) || key in overrides) {
      process.env[key] = value
    }
  }
}
