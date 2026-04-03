import type { AuthMeResponse } from '~~/types/api'
import { syncAppUserFromSession } from '~~/server/utils/auth'

export default defineEventHandler(async (event): Promise<AuthMeResponse> => {
  const user = await syncAppUserFromSession(event)

  return {
    user
  }
})
