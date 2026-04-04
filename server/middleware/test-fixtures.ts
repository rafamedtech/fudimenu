import { createError, defineEventHandler, getCookie, getRequestURL, readBody, setResponseStatus } from 'h3'

import { demoRestaurants } from '~~/lib/demo-data'
import { resolveRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import { testAuthCookieName, testOwnerSessionValue } from '~~/shared/test-auth'
import type { PublicRestaurantDetail, PublicRestaurantSummary } from '~~/types/domain'

const ownerUser = {
  id: 'test-owner-id',
  email: 'owner@fudimenu.test',
  fullName: 'Owner Demo',
  role: 'RESTAURANT_OWNER' as const
}

function resolveTestCoverImageUrl(slug: string) {
  return `/test-assets/restaurants/${slug}.svg`
}

const dashboardRestaurants = [
  {
    id: 'restaurant-brasa',
    name: 'Brasa Norte',
    slug: 'brasa-norte',
    description: 'Carnes, tacos y platos para compartir.',
    logoUrl: null,
    coverImageUrl: resolveTestCoverImageUrl('brasa-norte'),
    address: 'Av. Constitución 245',
    city: 'Tijuana',
    zone: 'Zona Río',
    phone: '+52 664 123 4567',
    whatsapp: '+52 664 123 4567',
    cuisineType: 'Mexicana contemporánea',
    businessHours: 'Lun-Dom 1:00 PM - 11:00 PM',
    isPublished: true,
    themeConfig: resolveRestaurantThemeConfig(demoRestaurants[0]?.themeConfig),
    createdAt: '2026-04-01T18:00:00.000Z',
    updatedAt: '2026-04-03T18:00:00.000Z',
    membershipRole: 'OWNER' as const
  },
  {
    id: 'restaurant-casa',
    name: 'Casa Marea',
    slug: 'casa-marea',
    description: 'Mariscos frescos y platos ligeros.',
    logoUrl: null,
    coverImageUrl: resolveTestCoverImageUrl('casa-marea'),
    address: 'Blvd. Agua Caliente 1120',
    city: 'Tijuana',
    zone: 'Hipódromo',
    phone: '+52 664 987 6543',
    whatsapp: '+52 664 987 6543',
    cuisineType: 'Mariscos',
    businessHours: 'Mar-Dom 12:00 PM - 10:00 PM',
    isPublished: false,
    themeConfig: resolveRestaurantThemeConfig(demoRestaurants[1]?.themeConfig),
    createdAt: '2026-04-02T18:00:00.000Z',
    updatedAt: '2026-04-03T18:30:00.000Z',
    membershipRole: 'OWNER' as const
  }
]

const dashboardCategories = dashboardRestaurants.flatMap((restaurant, restaurantIndex) => {
  const demoRestaurant = demoRestaurants[restaurantIndex]

  return (demoRestaurant?.categories ?? []).map((category, categoryIndex) => ({
    id: `${restaurant.id}-category-${category.slug ?? categoryIndex + 1}`,
    restaurantId: restaurant.id,
    name: category.name,
    slug: category.slug ?? null,
    sortOrder: category.sortOrder,
    isActive: category.isActive ?? true,
    itemCount: category.items.length,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt
  }))
})

const dashboardItems = dashboardRestaurants.flatMap((restaurant, restaurantIndex) => {
  const demoRestaurant = demoRestaurants[restaurantIndex]

  return (demoRestaurant?.categories ?? []).flatMap((category, categoryIndex) =>
    category.items.map((item, itemIndex) => ({
      id: `${restaurant.id}-item-${category.slug ?? categoryIndex + 1}-${itemIndex + 1}`,
      restaurantId: restaurant.id,
      categoryId: `${restaurant.id}-category-${category.slug ?? categoryIndex + 1}`,
      categoryName: category.name,
      name: item.name,
      description: item.description ?? null,
      price: String(item.price),
      imageUrl: null,
      isAvailable: item.isAvailable ?? true,
      sortOrder: item.sortOrder,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt
    }))
  )
})

function isCategoryActive(category: { isActive?: boolean }) {
  return category.isActive ?? true
}

function isItemAvailable(item: { isAvailable?: boolean }) {
  return item.isAvailable ?? true
}

function toPublicRestaurantSummary(
  restaurant: (typeof demoRestaurants)[number]
): PublicRestaurantSummary {
  return {
    id: restaurant.slug,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description ?? null,
    coverImageUrl: resolveTestCoverImageUrl(restaurant.slug),
    city: restaurant.city ?? null,
    zone: restaurant.zone ?? null,
    cuisineType: restaurant.cuisineType ?? null,
    themeConfig: resolveRestaurantThemeConfig(restaurant.themeConfig)
  }
}

function toPublicRestaurantDetail(
  restaurant: (typeof demoRestaurants)[number]
): PublicRestaurantDetail {
  return {
    ...toPublicRestaurantSummary(restaurant),
    address: restaurant.address ?? null,
    phone: restaurant.phone ?? null,
    whatsapp: restaurant.whatsapp ?? null,
    businessHours: restaurant.businessHours ?? null,
    logoUrl: null,
    categories: [...restaurant.categories]
      .filter(isCategoryActive)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((category, categoryIndex) => ({
        id: `${restaurant.slug}-${category.slug ?? categoryIndex + 1}`,
        name: category.name,
        slug: category.slug ?? null,
        sortOrder: category.sortOrder,
        items: [...category.items]
          .filter(isItemAvailable)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((item, itemIndex) => ({
            id: `${restaurant.slug}-${category.slug ?? categoryIndex + 1}-${itemIndex + 1}`,
            name: item.name,
            description: item.description ?? null,
            price: String(item.price),
            imageUrl: null,
            sortOrder: item.sortOrder
          }))
      }))
      .filter((category) => category.items.length > 0)
  }
}

function isOwnerAuthenticated(event: Parameters<typeof defineEventHandler>[0] extends never ? never : any) {
  return getCookie(event, testAuthCookieName) === testOwnerSessionValue
}

function requireOwnerTestSession(event: Parameters<typeof defineEventHandler>[0] extends never ? never : any) {
  if (isOwnerAuthenticated(event)) {
    return
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: {
      message: 'Necesitas iniciar sesión para continuar.'
    }
  })
}

export default defineEventHandler((event) => {
  if (process.env.NUXT_TEST_API_MOCKS !== 'true') {
    return
  }

  const pathname = getRequestURL(event).pathname

  if (pathname === '/api/public/restaurants') {
    return {
      restaurants: [...demoRestaurants]
        .filter((restaurant) => restaurant.isPublished)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(toPublicRestaurantSummary)
    }
  }

  const detailMatch = pathname.match(/^\/api\/public\/restaurants\/([^/]+)$/)

  if (!detailMatch) {
    if (pathname === '/api/auth/me') {
      requireOwnerTestSession(event)

      return {
        user: {
          ...ownerUser,
          memberships: dashboardRestaurants.map((restaurant) => ({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            restaurantSlug: restaurant.slug,
            role: restaurant.membershipRole
          }))
        }
      }
    }

    if (pathname === '/api/dashboard/restaurants') {
      requireOwnerTestSession(event)

      if (event.method === 'GET') {
        return {
          restaurants: dashboardRestaurants
        }
      }

      if (event.method === 'POST') {
        return readBody(event).then((payload) => {
          const body = payload as Record<string, string | boolean | Record<string, string>>
          const now = new Date().toISOString()
          const restaurant = {
            id: String(body.slug || 'nuevo-restaurante'),
            name: String(body.name || 'Nuevo restaurante'),
            slug: String(body.slug || 'nuevo-restaurante'),
            description: String(body.description || ''),
            logoUrl: String(body.logoUrl || '') || null,
            coverImageUrl: String(body.coverImageUrl || '') || null,
            address: String(body.address || ''),
            city: String(body.city || ''),
            zone: String(body.zone || ''),
            phone: String(body.phone || ''),
            whatsapp: String(body.whatsapp || ''),
            cuisineType: String(body.cuisineType || ''),
            businessHours: String(body.businessHours || ''),
            isPublished: Boolean(body.isPublished),
            themeConfig: resolveRestaurantThemeConfig(body.themeConfig),
            createdAt: now,
            updatedAt: now,
            membershipRole: 'OWNER' as const
          }

          dashboardRestaurants.unshift(restaurant)
          setResponseStatus(event, 201)

          return {
            restaurant
          }
        })
      }
    }

    const dashboardDetailMatch = pathname.match(/^\/api\/dashboard\/restaurants\/([^/]+)$/)

    if (dashboardDetailMatch) {
      requireOwnerTestSession(event)

      const restaurantId = decodeURIComponent(dashboardDetailMatch[1] ?? '')
      const restaurant = dashboardRestaurants.find((candidate) => candidate.id === restaurantId)

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
        restaurant
      }
    }

    const dashboardCategoriesMatch = pathname.match(/^\/api\/dashboard\/restaurants\/([^/]+)\/categories$/)

    if (dashboardCategoriesMatch) {
      requireOwnerTestSession(event)

      const restaurantId = decodeURIComponent(dashboardCategoriesMatch[1] ?? '')

      return {
        categories: dashboardCategories.filter((category) => category.restaurantId === restaurantId)
      }
    }

    const dashboardItemsMatch = pathname.match(/^\/api\/dashboard\/restaurants\/([^/]+)\/items$/)

    if (dashboardItemsMatch) {
      requireOwnerTestSession(event)

      const restaurantId = decodeURIComponent(dashboardItemsMatch[1] ?? '')

      return {
        items: dashboardItems.filter((item) => item.restaurantId === restaurantId)
      }
    }

    return
  }

  const slug = decodeURIComponent(detailMatch[1] ?? '')
  const restaurant = demoRestaurants.find((candidate) => candidate.slug === slug && candidate.isPublished)

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
    restaurant: toPublicRestaurantDetail(restaurant)
  }
})
