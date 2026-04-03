import type { AuthMeResponse } from '~~/types/api'
import type { AppUser } from '~~/types/domain'
import { testAuthCookieName } from '~~/shared/test-auth'

export function useAuthUser() {
  const runtimeConfig = useRuntimeConfig()
  const supabase = useSupabaseClient()
  const session = useSupabaseSession()
  const authClaims = useSupabaseUser()
  const testAuthCookie = useCookie<string | null>(testAuthCookieName, {
    default: () => null
  })
  const appUser = useState<AppUser | null>('app-user', () => null)
  const pending = useState('app-user-pending', () => false)
  const ready = useState('app-user-ready', () => false)
  const watchRegistered = useState('app-user-watch-registered', () => false)

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch
  const testAuthBypassEnabled = computed(() => Boolean(runtimeConfig.public.testAuthBypass))
  const hasTestSession = computed(() => testAuthBypassEnabled.value && Boolean(testAuthCookie.value))
  const supabaseUser = computed(() => {
    if (authClaims.value) {
      return authClaims.value
    }

    if (!hasTestSession.value) {
      return null
    }

    return {
      sub: `test-${testAuthCookie.value}`,
      email: `${testAuthCookie.value}@fudimenu.test`
    }
  })
  const isAuthenticated = computed(() => Boolean(session.value?.access_token) || hasTestSession.value)

  async function refreshAppUser(force = false) {
    if (!isAuthenticated.value) {
      appUser.value = null
      ready.value = true
      return null
    }

    if (pending.value) {
      return appUser.value
    }

    if (ready.value && appUser.value && !force) {
      return appUser.value
    }

    pending.value = true

    try {
      const response = await requestFetch<AuthMeResponse>('/api/auth/me')
      appUser.value = response.user
      return response.user
    } finally {
      pending.value = false
      ready.value = true
    }
  }

  function clearAppUser() {
    pending.value = false
    appUser.value = null
    ready.value = true
  }

  async function signOut(redirectTo = '/') {
    if (!session.value?.access_token && hasTestSession.value) {
      testAuthCookie.value = null
      clearAppUser()
      await navigateTo(redirectTo)
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    if (testAuthBypassEnabled.value) {
      testAuthCookie.value = null
    }

    clearAppUser()
    await navigateTo(redirectTo)
  }

  if (import.meta.client && !watchRegistered.value) {
    watchRegistered.value = true

    watch(
      () => supabaseUser.value?.sub ?? null,
      async (userId) => {
        ready.value = false

        if (!userId) {
          clearAppUser()
          return
        }

        await refreshAppUser(true).catch(() => {
          clearAppUser()
        })
      },
      { immediate: true }
    )
  }

  return {
    supabaseUser,
    session,
    appUser,
    pending: readonly(pending),
    ready: readonly(ready),
    isAuthenticated,
    refreshAppUser,
    clearAppUser,
    signOut
  }
}
