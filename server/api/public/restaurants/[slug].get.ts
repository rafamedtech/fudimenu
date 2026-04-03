import { createError } from 'h3'

import { prisma } from '~~/lib/prisma'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import type { PublicRestaurantResponse } from '~~/types/api'

export default defineEventHandler(async (event): Promise<PublicRestaurantResponse> => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing slug',
      data: {
        message: 'Necesitamos un slug para buscar el restaurante.'
      }
    })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      slug,
      isPublished: true
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      city: true,
      zone: true,
      cuisineType: true,
      themeConfig: true,
      address: true,
      phone: true,
      whatsapp: true,
      businessHours: true,
      logoUrl: true,
      categories: {
        where: {
          isActive: true
        },
        orderBy: [
          {
            sortOrder: 'asc'
          },
          {
            createdAt: 'asc'
          }
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
          items: {
            where: {
              isAvailable: true
            },
            orderBy: [
              {
                sortOrder: 'asc'
              },
              {
                createdAt: 'asc'
              }
            ],
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              sortOrder: true
            }
          }
        }
      }
    }
  })

  if (!restaurant) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Restaurant not found',
      data: {
        message: 'No encontramos ese restaurante o todavía no está publicado.'
      }
    })
  }

  return {
    restaurant: {
      ...restaurant,
      themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig),
      categories: restaurant.categories
        .map((category) => ({
          ...category,
          items: category.items.map((item) => ({
            ...item,
            price: item.price.toString()
          }))
        }))
        .filter((category) => category.items.length > 0)
    }
  }
})
