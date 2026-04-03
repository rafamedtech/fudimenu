export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuthUser()

  if (isAuthenticated.value) {
    const redirectTo = typeof to.query.redirect === 'string' ? to.query.redirect : '/dashboard'

    return navigateTo(redirectTo)
  }
})
