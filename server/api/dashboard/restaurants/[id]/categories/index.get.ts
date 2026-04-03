import type { DashboardCategoriesResponse } from '~~/types/api'

import { assertRestaurantAccess } from '~~/server/utils/permissions'
import { listDashboardMenuCategories } from '~~/server/utils/menu-categories'
import { parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardCategoriesResponse> => {
  const restaurantId = parseUuidParam(getRouterParam(event, 'id'), 'restaurantId')
  await assertRestaurantAccess(event, restaurantId)

  return {
    categories: await listDashboardMenuCategories(restaurantId)
  }
})
