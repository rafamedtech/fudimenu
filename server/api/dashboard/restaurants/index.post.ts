import { GlobalRole, RestaurantMembershipRole } from '~~/generated/prisma/client'
import { prisma } from '~~/lib/prisma'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type { DashboardRestaurantResponse } from '~~/types/api'
import { requireAppUser } from '~~/server/utils/auth'
import { assertUniqueRestaurantSlug } from '~~/server/utils/slug'
import { restaurantPayloadSchema } from '~~/server/utils/validation'

export default defineEventHandler(async (event): Promise<DashboardRestaurantResponse> => {
  const user = await requireAppUser(event)
  const payload = restaurantPayloadSchema.parse(await readBody(event))

  await assertUniqueRestaurantSlug(payload.slug)

  const restaurant = await prisma.$transaction(async (tx) => {
    const createdRestaurant = await tx.restaurant.create({
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

    await tx.restaurantMember.create({
      data: {
        userId: user.id,
        restaurantId: createdRestaurant.id,
        role: RestaurantMembershipRole.OWNER
      }
    })

    if (user.role === GlobalRole.USER) {
      await tx.user.update({
        where: {
          id: user.id
        },
        data: {
          role: GlobalRole.RESTAURANT_OWNER
        }
      })
    }

    return createdRestaurant
  })

  setResponseStatus(event, 201)

  return {
    restaurant: {
      ...restaurant,
      themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig),
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
      membershipRole: 'OWNER'
    }
  }
})
