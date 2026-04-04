import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import RestaurantCard from '~/components/restaurants/Card.vue'

import { buildPublicRestaurantSummary } from '~~/tests/factories/domain'

describe('RestaurantCard', () => {
  it('renderiza nombre, tipo de comida, ubicación y acción principal', async () => {
    const restaurant = buildPublicRestaurantSummary({
      name: 'Casa Marea',
      slug: 'casa-marea',
      cuisineType: 'Mariscos',
      city: 'Tijuana',
      zone: 'Playas',
      description: 'Tostadas y ceviches para compartir.'
    })

    const wrapper = await mountSuspended(RestaurantCard, {
      props: {
        restaurant
      }
    })

    const link = wrapper.get('a')

    expect(link.attributes('href')).toBe('/r/casa-marea')
    expect(link.attributes('aria-label')).toBe('Abrir el restaurante Casa Marea')
    expect(wrapper.get('h2').text()).toBe('Casa Marea')
    expect(wrapper.text()).toContain('Mariscos')
    expect(wrapper.text()).toContain('Playas, Tijuana')
    expect(wrapper.text()).toContain('Ver detalle y menu')
  })

  it('mantiene fallback claro cuando no hay imagen de portada', async () => {
    const restaurant = buildPublicRestaurantSummary({
      coverImageUrl: null,
      name: 'Brasa Norte'
    })

    const wrapper = await mountSuspended(RestaurantCard, {
      props: {
        restaurant
      }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Brasa Norte')
    expect(wrapper.text()).toContain('Publicado')
  })

  it('muestra la imagen con alt útil cuando existe portada', async () => {
    const restaurant = buildPublicRestaurantSummary({
      name: 'Brasa Norte',
      coverImageUrl: '/test-assets/restaurants/brasa-norte.svg'
    })

    const wrapper = await mountSuspended(RestaurantCard, {
      props: {
        restaurant
      }
    })

    const image = wrapper.get('img')

    expect(image.attributes('src')).toBe('/test-assets/restaurants/brasa-norte.svg')
    expect(image.attributes('alt')).toBe('Portada de Brasa Norte')
  })
})
