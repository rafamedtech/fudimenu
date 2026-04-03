import type { DashboardItemsResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'
import { assertRestaurantAccess } from '~~/server/utils/permissions'
import { parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardItemsResponse> => {
  const restaurantId = parseUuidParam(getRouterParam(event, 'id'), 'restaurantId')
  await assertRestaurantAccess(event, restaurantId)

  const items = await prisma.menuItem.findMany({
    where: {
      category: {
        restaurantId
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      isAvailable: true,
      sortOrder: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      category: {
        select: {
          name: true,
          restaurantId: true,
          sortOrder: true
        }
      }
    }
  })

  const sortedItems = items
    .slice()
    .sort((left, right) => {
      if (left.category.sortOrder !== right.category.sortOrder) {
        return left.category.sortOrder - right.category.sortOrder
      }

      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.name.localeCompare(right.name, 'es-MX')
    })

  return {
    items: sortedItems.map((item) => ({
      id: item.id,
      restaurantId: item.category.restaurantId,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    }))
  }
})
