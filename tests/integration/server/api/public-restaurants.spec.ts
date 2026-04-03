import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
vi.stubGlobal('getRouterParam', (event: H3Event, name: string) => event.context.params?.[name])

const prismaMock = {
  restaurant: {
    findMany: vi.fn(),
    findFirst: vi.fn()
  }
}

vi.mock('~~/lib/prisma', () => ({
  prisma: prismaMock
}))

const listPublicRestaurants = (await import('~~/server/api/public/restaurants/index.get')).default
const getPublicRestaurantDetail = (await import('~~/server/api/public/restaurants/[slug].get')).default

describe('public restaurant endpoints', () => {
  beforeEach(() => {
    prismaMock.restaurant.findMany.mockReset()
    prismaMock.restaurant.findFirst.mockReset()
  })

  it('returns published restaurant summaries for the discovery home', async () => {
    prismaMock.restaurant.findMany.mockResolvedValue([
      {
        id: 'restaurant-1',
        name: 'Brasa Norte',
        slug: 'brasa-norte',
        description: 'Carnes y tacos para compartir.',
        coverImageUrl: null,
        city: 'Tijuana',
        zone: 'Zona Río',
        cuisineType: 'Mexicana contemporánea',
        themeConfig: {
          primary: 'amber',
          neutral: 'stone',
          radius: '0.375',
          font: 'public-sans',
          icons: 'lucide',
          colorMode: 'light'
        }
      }
    ])

    const response = await listPublicRestaurants()

    expect(prismaMock.restaurant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublished: true
        }
      })
    )
    expect(response.restaurants.map((restaurant) => restaurant.slug)).toEqual(['brasa-norte'])
    expect(response.restaurants[0]?.themeConfig.primary).toBe('amber')
  })

  it('filters inactive categories and unavailable items from the public restaurant detail', async () => {
    prismaMock.restaurant.findFirst.mockResolvedValue({
      id: 'restaurant-1',
      name: 'Brasa Norte',
      slug: 'brasa-norte',
      description: 'Carnes y tacos para compartir.',
      coverImageUrl: null,
      city: 'Tijuana',
      zone: 'Zona Río',
      cuisineType: 'Mexicana contemporánea',
      themeConfig: {
        primary: 'amber',
        neutral: 'stone',
        radius: '0.375',
        font: 'public-sans',
        icons: 'lucide',
        colorMode: 'light'
      },
      address: 'Av. Constitución 245',
      phone: '+52 664 123 4567',
      whatsapp: '+52 664 123 4567',
      businessHours: 'Lun-Dom 1:00 PM - 11:00 PM',
      logoUrl: null,
      categories: [
        {
          id: 'category-1',
          name: 'Tacos',
          slug: 'tacos',
          sortOrder: 1,
          items: [
            {
              id: 'item-1',
              name: 'Taco de rib eye',
              description: 'Rib eye, cebolla asada y salsa tatemada.',
              price: '74.00',
              imageUrl: null,
              sortOrder: 1
            }
          ]
        },
        {
          id: 'category-2',
          name: 'Temporada',
          slug: 'temporada',
          sortOrder: 2,
          items: []
        }
      ]
    })

    const response = await getPublicRestaurantDetail({
      context: {
        params: {
          slug: 'brasa-norte'
        }
      }
    } as H3Event)

    expect(response.restaurant.slug).toBe('brasa-norte')
    expect(prismaMock.restaurant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: 'brasa-norte',
          isPublished: true
        },
        select: expect.objectContaining({
          categories: expect.objectContaining({
            where: {
              isActive: true
            },
            select: expect.objectContaining({
              items: expect.objectContaining({
                where: {
                  isAvailable: true
                }
              })
            })
          })
        })
      })
    )
    expect(response.restaurant.categories.map((category) => category.slug)).toEqual(['tacos'])
    expect(response.restaurant.categories[0]?.items[0]?.price).toBe('74.00')
  })
})
