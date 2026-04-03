import type { DashboardRestaurantsResponse } from '~~/types/api'
import type { DashboardRestaurant } from '~~/types/domain'

import { prisma } from '~~/lib/prisma'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import { requireAppUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event): Promise<DashboardRestaurantsResponse> => {
  const user = await requireAppUser(event)

  let restaurants: DashboardRestaurant[] = []

  if (user.role === 'ADMIN') {
    const adminRestaurants = await prisma.restaurant.findMany({
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

    restaurants = adminRestaurants.map((restaurant) => ({
      ...restaurant,
      themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig),
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
      membershipRole: 'OWNER'
    }))
  } else {
    const memberships = await prisma.restaurantMember.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        {
          restaurant: {
            name: 'asc'
          }
        }
      ],
      select: {
        role: true,
        restaurant: {
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
        }
      }
    })

    restaurants = memberships.map((membership) => ({
      ...membership.restaurant,
      themeConfig: resolveRestaurantThemeConfig(membership.restaurant.themeConfig),
      createdAt: membership.restaurant.createdAt.toISOString(),
      updatedAt: membership.restaurant.updatedAt.toISOString(),
      membershipRole: membership.role
    }))
  }

  return {
    restaurants
  }
})
