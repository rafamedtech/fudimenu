import type { DashboardCategoriesResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'
import { listDashboardMenuCategories } from '~~/server/utils/menu-categories'
import { assertCategoryAccess } from '~~/server/utils/permissions'
import { parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardCategoriesResponse> => {
  const categoryId = parseUuidParam(getRouterParam(event, 'id'), 'categoryId')
  const access = await assertCategoryAccess(event, categoryId)

  await prisma.menuCategory.delete({
    where: {
      id: categoryId
    }
  })

  return {
    categories: await listDashboardMenuCategories(access.category.restaurantId)
  }
})
