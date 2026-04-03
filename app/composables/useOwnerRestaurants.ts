import type { DashboardRestaurantsResponse } from '~~/types/api'

export function useOwnerRestaurants() {
  const response = useFetch<DashboardRestaurantsResponse>('/api/dashboard/restaurants', {
    default: () => ({ restaurants: [] })
  })

  return {
    ...response,
    restaurants: computed(() => response.data.value?.restaurants ?? [])
  }
}
