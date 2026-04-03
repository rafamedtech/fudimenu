import type { BrowserContext } from '@playwright/test'

import { testAuthCookieName, testOwnerSessionValue } from '~~/shared/test-auth'

export async function enableOwnerSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: testAuthCookieName,
      value: testOwnerSessionValue,
      url: baseURL
    }
  ])
}
