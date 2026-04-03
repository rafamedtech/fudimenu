export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path !== '/dashboard' && !to.path.startsWith('/dashboard/')) {
    return
  }

  const { isAuthenticated, refreshAppUser } = useAuthUser()

  if (!isAuthenticated.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  try {
    await refreshAppUser()
  } catch (error) {
    const maybeError = error as { statusCode?: number }

    if (maybeError.statusCode === 401) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }
})
