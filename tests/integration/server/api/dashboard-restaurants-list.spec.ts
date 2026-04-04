import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)

const {
  requireAppUserMock,
  resolveRestaurantThemeConfigMock,
  restaurantFindManyMock,
  restaurantMemberFindManyMock
} = vi.hoisted(() => ({
  requireAppUserMock: vi.fn(),
  resolveRestaurantThemeConfigMock: vi.fn(),
  restaurantFindManyMock: vi.fn(),
  restaurantMemberFindManyMock: vi.fn()
}))

const prismaMock = {
  restaurant: {
    findMany: restaurantFindManyMock
  },
  restaurantMember: {
    findMany: restaurantMemberFindManyMock
  }
}

vi.mock('~~/server/utils/auth', () => ({
  requireAppUser: requireAppUserMock
}))

vi.mock('~~/lib/restaurant-theme', () => ({
  resolveRestaurantThemeConfig: resolveRestaurantThemeConfigMock
}))

vi.mock('~~/lib/prisma', () => ({
  prisma: prismaMock
}))

const listDashboardRestaurants = (await import('~~/server/api/dashboard/restaurants/index.get')).default

describe('dashboard restaurants list route', () => {
  beforeEach(() => {
    requireAppUserMock.mockReset()
    resolveRestaurantThemeConfigMock.mockReset()
    restaurantFindManyMock.mockReset()
    restaurantMemberFindManyMock.mockReset()
  })

  it('returns the owner restaurants with resolved theme config and ISO timestamps', async () => {
    requireAppUserMock.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000501',
      email: 'owner@fudimenu.test',
      fullName: 'Owner Demo',
      role: 'RESTAURANT_OWNER',
      memberships: []
    })

    restaurantMemberFindManyMock.mockResolvedValue([
      {
        role: 'OWNER',
        restaurant: {
          id: 'restaurant-1',
          name: 'Brasa Norte',
          slug: 'brasa-norte',
          description: 'Carnes y tacos para compartir.',
          logoUrl: 'https://cdn.fudimenu.test/logos/brasa-norte.png',
          coverImageUrl: 'https://cdn.fudimenu.test/covers/brasa-norte.jpg',
          address: 'Av. Constitución 245',
          city: 'Tijuana',
          zone: 'Zona Río',
          phone: '+52 664 123 4567',
          whatsapp: '+52 664 123 4567',
          cuisineType: 'Mexicana contemporánea',
          businessHours: 'Lun-Dom 1:00 PM - 11:00 PM',
          isPublished: true,
          themeConfig: {
            primary: 'emerald'
          },
          createdAt: new Date('2026-04-03T12:00:00.000Z'),
          updatedAt: new Date('2026-04-03T14:30:00.000Z')
        }
      }
    ])

    resolveRestaurantThemeConfigMock.mockImplementation((themeConfig: unknown) => ({
      themeConfig,
      normalized: true
    }))

    const response = await listDashboardRestaurants({} as H3Event)

    expect(restaurantMemberFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: '00000000-0000-4000-8000-000000000501'
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

    expect(resolveRestaurantThemeConfigMock).toHaveBeenCalledWith({
      primary: 'emerald'
    })
    expect(response.restaurants).toEqual([
      expect.objectContaining({
        id: 'restaurant-1',
        membershipRole: 'OWNER',
        createdAt: '2026-04-03T12:00:00.000Z',
        updatedAt: '2026-04-03T14:30:00.000Z',
        themeConfig: {
          themeConfig: {
            primary: 'emerald'
          },
          normalized: true
        }
      })
    ])
  })
})
