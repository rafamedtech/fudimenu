import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GlobalRole, RestaurantMembershipRole } from '~~/generated/prisma/enums'
import { buildAppUser } from '~~/tests/factories/domain'

const requireAppUserMock = vi.fn()
const prismaMock = {
  restaurant: {
    findUnique: vi.fn()
  },
  restaurantMember: {
    findUnique: vi.fn()
  },
  menuCategory: {
    findUnique: vi.fn()
  },
  menuItem: {
    findUnique: vi.fn()
  }
}

vi.mock('~~/server/utils/auth', () => ({
  requireAppUser: requireAppUserMock
}))

vi.mock('~~/lib/prisma', () => ({
  prisma: prismaMock
}))

const { assertRestaurantAccess, assertRestaurantOwnerAccess } = await import('~~/server/utils/permissions')

describe('restaurant permissions', () => {
  beforeEach(() => {
    requireAppUserMock.mockReset()
    prismaMock.restaurant.findUnique.mockReset()
    prismaMock.restaurantMember.findUnique.mockReset()
  })

  it('allows admins to access an existing restaurant without membership lookup', async () => {
    requireAppUserMock.mockResolvedValue(
      buildAppUser({
        role: GlobalRole.ADMIN
      })
    )

    prismaMock.restaurant.findUnique.mockResolvedValue({
      id: 'restaurant-1',
      name: 'Brasa Norte',
      slug: 'brasa-norte'
    })

    const result = await assertRestaurantAccess({} as H3Event, 'restaurant-1')

    expect(result.membershipRole).toBe(RestaurantMembershipRole.OWNER)
    expect(result.restaurant.slug).toBe('brasa-norte')
    expect(prismaMock.restaurantMember.findUnique).not.toHaveBeenCalled()
  })

  it('rejects members without the required owner role', async () => {
    requireAppUserMock.mockResolvedValue(
      buildAppUser({
        role: GlobalRole.RESTAURANT_OWNER
      })
    )

    prismaMock.restaurantMember.findUnique.mockResolvedValue({
      role: RestaurantMembershipRole.MANAGER,
      restaurant: {
        id: 'restaurant-1',
        name: 'Brasa Norte',
        slug: 'brasa-norte'
      }
    })

    await expect(assertRestaurantOwnerAccess({} as H3Event, 'restaurant-1')).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  })
})
