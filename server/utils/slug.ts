import { createError } from 'h3'

import { prisma } from '~~/lib/prisma'

export function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function assertUniqueRestaurantSlug(slug: string, excludeRestaurantId?: string) {
  const existingRestaurant = await prisma.restaurant.findFirst({
    where: {
      slug,
      ...(excludeRestaurantId
        ? {
            NOT: {
              id: excludeRestaurantId
            }
          }
        : {})
    },
    select: {
      id: true
    }
  })

  if (existingRestaurant) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Slug already in use',
      data: {
        message: 'Ese slug ya está siendo usado por otro restaurante.'
      }
    })
  }
}

export async function assertUniqueCategorySlug(
  restaurantId: string,
  slug: string | null,
  excludeCategoryId?: string
) {
  if (!slug) {
    return
  }

  const existingCategory = await prisma.menuCategory.findFirst({
    where: {
      restaurantId,
      slug,
      ...(excludeCategoryId
        ? {
            NOT: {
              id: excludeCategoryId
            }
          }
        : {})
    },
    select: {
      id: true
    }
  })

  if (existingCategory) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Category slug already in use',
      data: {
        message: 'Ese slug ya está siendo usado en este restaurante.'
      }
    })
  }
}
