import { createError } from 'h3'

import { prisma } from '~~/lib/prisma'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type { DashboardRestaurantResponse } from '~~/types/api'
import { assertRestaurantOwnerAccess } from '~~/server/utils/permissions'
import { parseUuidParam } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardRestaurantResponse> => {
  const restaurantId = parseUuidParam(getRouterParam(event, 'id'), 'restaurantId')
  const access = await assertRestaurantOwnerAccess(event, restaurantId)

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: restaurantId
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverImageUrl: true,
      address: true,
      city: true,
      zone: true,
      phone: true,
      whatsapp: true,
      cuisineType: true,
      businessHours: true,
      isPublished: true,
      themeConfig: true,
      createdAt: true,
      updatedAt: true
    }
  })

  if (!restaurant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Restaurant not found',
      data: {
        message: 'No encontramos ese restaurante.'
      }
    })
  }

  return {
    restaurant: {
      ...restaurant,
      themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig),
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
      membershipRole: access.membershipRole
    }
  }
})
