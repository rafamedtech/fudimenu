import type { AuthMeResponse } from '~~/types/api'
import type { AppUser } from '~~/types/domain'

export function useAuthUser() {
  const supabase = useSupabaseClient()
  const session = useSupabaseSession()
  const authClaims = useSupabaseUser()
  const appUser = useState<AppUser | null>('app-user', () => null)
  const pending = useState('app-user-pending', () => false)
  const ready = useState('app-user-ready', () => false)
  const watchRegistered = useState('app-user-watch-registered', () => false)

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch
  const supabaseUser = computed(() => authClaims.value)
  const isAuthenticated = computed(() => Boolean(session.value?.access_token))

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
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
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
