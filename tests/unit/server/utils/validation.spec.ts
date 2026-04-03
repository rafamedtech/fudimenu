import { describe, expect, it } from 'vitest'

import { defaultRestaurantThemeConfig } from '~~/lib/restaurant-theme'
import { menuItemPayloadSchema, restaurantPayloadSchema } from '~~/server/utils/validation'
import { buildRestaurantPayload } from '~~/tests/factories/domain'

describe('restaurantPayloadSchema', () => {
  it('trims required values and applies defaults', () => {
    const parsed = restaurantPayloadSchema.parse({
      ...buildRestaurantPayload(),
      name: '  Brasa Norte  ',
      themeConfig: undefined
    })

    expect(parsed.name).toBe('Brasa Norte')
    expect(parsed.description).toBe('Carnes y tacos para compartir.')
    expect(parsed.logoUrl).toBe('https://cdn.fudimenu.test/logos/brasa-norte.png')
    expect(parsed.isPublished).toBe(false)
    expect(parsed.themeConfig).toEqual(defaultRestaurantThemeConfig)
  })
})

describe('menuItemPayloadSchema', () => {
  it('coerces numeric fields and rejects invalid prices', () => {
    const parsed = menuItemPayloadSchema.parse({
      categoryId: '00000000-0000-4000-8000-000000000001',
      name: 'Taco de rib eye',
      description: 'Rib eye, cebolla asada y salsa tatemada.',
      price: '74.50',
      sortOrder: '3'
    })

    expect(parsed.description).toBe('Rib eye, cebolla asada y salsa tatemada.')
    expect(parsed.price).toBe(74.5)
    expect(parsed.isAvailable).toBe(true)
    expect(parsed.sortOrder).toBe(3)

    expect(() =>
      menuItemPayloadSchema.parse({
        ...parsed,
        price: '0'
      })
    ).toThrow('El precio debe ser mayor a cero.')
  })
})
