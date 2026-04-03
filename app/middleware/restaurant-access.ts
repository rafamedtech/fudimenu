export default defineNuxtRouteMiddleware(async (to) => {
  const restaurantId = Array.isArray(to.params.id) ? to.params.id[0] : to.params.id

  if (!restaurantId) {
    return navigateTo('/dashboard/restaurants')
  }

  const requestFetch = import.meta.server ? useRequestFetch() : $fetch

  try {
    await requestFetch(`/api/dashboard/restaurants/${restaurantId}`)
  } catch (error) {
    const maybeError = error as { statusCode?: number }

    if (maybeError.statusCode === 401) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    return navigateTo('/dashboard/restaurants')
  }
})
