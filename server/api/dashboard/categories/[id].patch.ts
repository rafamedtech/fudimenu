import type { DashboardCategoriesResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'
import { listDashboardMenuCategories } from '~~/server/utils/menu-categories'
import { assertCategoryAccess } from '~~/server/utils/permissions'
import { assertUniqueCategorySlug } from '~~/server/utils/slug'
import { categoryPayloadSchema, parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardCategoriesResponse> => {
  const categoryId = parseUuidParam(getRouterParam(event, 'id'), 'categoryId')
  const payload = categoryPayloadSchema.parse(await readBody(event))

  const access = await assertCategoryAccess(event, categoryId)
  await assertUniqueCategorySlug(access.category.restaurantId, payload.slug, categoryId)

  await prisma.menuCategory.update({
    where: {
      id: categoryId
    },
    data: payload
  })

  return {
    categories: await listDashboardMenuCategories(access.category.restaurantId)
  }
})
