import type { DashboardRestaurantResponse } from '~~/types/api'

import { prisma } from '~~/lib/prisma'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import { assertRestaurantOwnerAccess } from '~~/server/utils/permissions'
import { assertUniqueRestaurantSlug } from '~~/server/utils/slug'
import { parseUuidParam, restaurantPayloadSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardRestaurantResponse> => {
  const restaurantId = parseUuidParam(getRouterParam(event, 'id'), 'restaurantId')
  const payload = restaurantPayloadSchema.parse(await readBody(event))

  const access = await assertRestaurantOwnerAccess(event, restaurantId)
  await assertUniqueRestaurantSlug(payload.slug, restaurantId)

  const restaurant = await prisma.restaurant.update({
    where: {
      id: restaurantId
    },
    data: payload,
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
