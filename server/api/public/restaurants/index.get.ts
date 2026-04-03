import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type { PublicRestaurantsResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'

export default defineEventHandler(async (): Promise<PublicRestaurantsResponse> => {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      isPublished: true
    },
    orderBy: [
      {
        name: 'asc'
      }
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      city: true,
      zone: true,
      cuisineType: true,
      themeConfig: true
    }
  })

  return {
    restaurants: restaurants.map((restaurant) => ({
      ...restaurant,
      themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig)
    }))
  }
})
