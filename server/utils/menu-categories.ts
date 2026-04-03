import { prisma } from '~~/lib/prisma'
import type { DashboardMenuCategory } from '~~/types/domain'

const dashboardMenuCategorySelect = {
  id: true,
  restaurantId: true,
  name: true,
  slug: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      items: true
    }
  }
} as const

export async function listDashboardMenuCategories(
  restaurantId: string
): Promise<DashboardMenuCategory[]> {
  const categories = await prisma.menuCategory.findMany({
    where: {
      restaurantId
    },
    orderBy: [
      {
        sortOrder: 'asc'
      },
      {
        createdAt: 'asc'
      }
    ],
    select: dashboardMenuCategorySelect
  })

  return categories.map((category) => ({
    id: category.id,
    restaurantId: category.restaurantId,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    itemCount: category._count.items,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString()
  }))
}
