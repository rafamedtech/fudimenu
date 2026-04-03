import type { DashboardCategoriesResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'
import { listDashboardMenuCategories } from '~~/server/utils/menu-categories'
import { assertRestaurantAccess } from '~~/server/utils/permissions'
import { assertUniqueCategorySlug } from '~~/server/utils/slug'
import { categoryPayloadSchema, parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardCategoriesResponse> => {
  const restaurantId = parseUuidParam(getRouterParam(event, 'id'), 'restaurantId')
  const payload = categoryPayloadSchema.parse(await readBody(event))

  await assertRestaurantAccess(event, restaurantId)
  await assertUniqueCategorySlug(restaurantId, payload.slug)

  await prisma.menuCategory.create({
    data: {
      restaurantId,
      ...payload
    }
  })

  setResponseStatus(event, 201)

  return {
    categories: await listDashboardMenuCategories(restaurantId)
  }
})
