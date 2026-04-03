import { createError, type H3Event } from 'h3'
import { RestaurantMembershipRole } from '~~/generated/prisma/client'

import { prisma } from '~~/lib/prisma'
import { requireAppUser } from '~~/server/utils/auth'

interface RestaurantAccessOptions {
  allowedRoles?: RestaurantMembershipRole[]
}

export async function assertRestaurantAccess(
  event: H3Event,
  restaurantId: string,
  options: RestaurantAccessOptions = {}
) {
  const user = await requireAppUser(event)

  if (user.role === 'ADMIN') {
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        id: restaurantId
      },
      select: {
        id: true,
        name: true,
        slug: true
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
      user,
      restaurant,
      membershipRole: 'OWNER' as const
    }
  }

  const membership = await prisma.restaurantMember.findUnique({
    where: {
      userId_restaurantId: {
        userId: user.id,
        restaurantId
      }
    },
    select: {
      role: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  if (!membership) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        message: 'No tienes permisos para administrar este restaurante.'
      }
    })
  }

  if (options.allowedRoles && !options.allowedRoles.includes(membership.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        message: 'Solo el owner autorizado puede editar este restaurante.'
      }
    })
  }

  return {
    user,
    restaurant: membership.restaurant,
    membershipRole: membership.role
  }
}

export async function assertRestaurantOwnerAccess(event: H3Event, restaurantId: string) {
  return assertRestaurantAccess(event, restaurantId, {
    allowedRoles: [RestaurantMembershipRole.OWNER]
  })
}

export async function assertCategoryAccess(event: H3Event, categoryId: string) {
  const category = await prisma.menuCategory.findUnique({
    where: {
      id: categoryId
    },
    select: {
      id: true,
      restaurantId: true
    }
  })

  if (!category) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Category not found',
      data: {
        message: 'No encontramos esa categoría.'
      }
    })
  }

  const access = await assertRestaurantAccess(event, category.restaurantId)

  return {
    ...access,
    category
  }
}

export async function assertMenuItemAccess(event: H3Event, itemId: string) {
  const item = await prisma.menuItem.findUnique({
    where: {
      id: itemId
    },
    select: {
      id: true,
      categoryId: true,
      category: {
        select: {
          restaurantId: true
        }
      }
    }
  })

  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Menu item not found',
      data: {
        message: 'No encontramos ese platillo.'
      }
    })
  }

  const access = await assertRestaurantAccess(event, item.category.restaurantId)

  return {
    ...access,
    item
  }
}
