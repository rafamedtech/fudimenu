import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GlobalRole, RestaurantMembershipRole } from '~~/generated/prisma/enums'
import { buildAppUser, buildRestaurantPayload } from '~~/tests/factories/domain'

vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)

const requireAppUserMock = vi.fn()
const assertUniqueRestaurantSlugMock = vi.fn()
const readBodyMock = vi.fn()

const transactionSpies = {
  restaurantCreate: vi.fn(),
  restaurantMemberCreate: vi.fn(),
  userUpdate: vi.fn()
}

const prismaMock = {
  $transaction: vi.fn(async (callback: (tx: {
    restaurant: { create: typeof transactionSpies.restaurantCreate }
    restaurantMember: { create: typeof transactionSpies.restaurantMemberCreate }
    user: { update: typeof transactionSpies.userUpdate }
  }) => unknown) => callback({
    restaurant: {
      create: transactionSpies.restaurantCreate
    },
    restaurantMember: {
      create: transactionSpies.restaurantMemberCreate
    },
    user: {
      update: transactionSpies.userUpdate
    }
  }))
}

vi.mock('~~/server/utils/auth', () => ({
  requireAppUser: requireAppUserMock
}))

vi.mock('~~/server/utils/slug', () => ({
  assertUniqueRestaurantSlug: assertUniqueRestaurantSlugMock
}))

vi.mock('~~/lib/prisma', () => ({
  prisma: prismaMock
}))

vi.stubGlobal('readBody', readBodyMock)

const createDashboardRestaurant = (await import('~~/server/api/dashboard/restaurants/index.post')).default

describe('dashboard restaurant creation route', () => {
  beforeEach(() => {
    requireAppUserMock.mockReset()
    assertUniqueRestaurantSlugMock.mockReset()
    readBodyMock.mockReset()
    prismaMock.$transaction.mockClear()
    transactionSpies.restaurantCreate.mockReset()
    transactionSpies.restaurantMemberCreate.mockReset()
    transactionSpies.userUpdate.mockReset()
  })

  it('creates a restaurant, links the owner membership and promotes the user role when needed', async () => {
    const payload = buildRestaurantPayload({
      name: 'Tacos 24',
      slug: 'tacos-24',
      isPublished: true
    })

    requireAppUserMock.mockResolvedValue(
      buildAppUser({
        id: '00000000-0000-4000-8000-000000000111',
        role: GlobalRole.USER
      })
    )
    readBodyMock.mockResolvedValue(payload)
    transactionSpies.restaurantCreate.mockResolvedValue({
      id: 'restaurant-24',
      ...payload,
      description: payload.description,
      logoUrl: payload.logoUrl,
      coverImageUrl: payload.coverImageUrl,
      address: payload.address,
      city: payload.city,
      zone: payload.zone,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      cuisineType: payload.cuisineType,
      businessHours: payload.businessHours,
      createdAt: new Date('2026-04-03T12:00:00.000Z'),
      updatedAt: new Date('2026-04-03T12:00:00.000Z')
    })

    const response = await createDashboardRestaurant({} as H3Event)

    expect(assertUniqueRestaurantSlugMock).toHaveBeenCalledWith('tacos-24')
    expect(transactionSpies.restaurantMemberCreate).toHaveBeenCalledWith({
      data: {
        userId: '00000000-0000-4000-8000-000000000111',
        restaurantId: 'restaurant-24',
        role: RestaurantMembershipRole.OWNER
      }
    })
    expect(transactionSpies.userUpdate).toHaveBeenCalledWith({
      where: {
        id: '00000000-0000-4000-8000-000000000111'
      },
      data: {
        role: GlobalRole.RESTAURANT_OWNER
      }
    })
    expect(response.restaurant).toEqual(
      expect.objectContaining({
        id: 'restaurant-24',
        slug: 'tacos-24',
        membershipRole: 'OWNER',
        isPublished: true
      })
    )
  })
})
