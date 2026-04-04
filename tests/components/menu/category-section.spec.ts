import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import MenuCategorySection from '~/components/menu/CategorySection.vue'

import { formatCurrency } from '~~/lib/formatters'
import { buildPublicMenuCategory, buildPublicMenuItem } from '~~/tests/factories/domain'

describe('MenuCategorySection', () => {
  it('renderiza el título, los platillos y los precios visibles', async () => {
    const category = buildPublicMenuCategory({
      name: 'Especialidades',
      items: [
        buildPublicMenuItem({
          name: 'Taco gobernador',
          description: 'Camarón salteado con queso y salsa tatemada.',
          price: '149.00'
        }),
        buildPublicMenuItem({
          name: 'Tostada de atún',
          description: 'Atún fresco, ponzu y chile serrano.',
          price: '189.00'
        })
      ]
    })

    const wrapper = await mountSuspended(MenuCategorySection, {
      props: {
        category,
        sectionId: 'especialidades'
      }
    })

    expect(wrapper.get('section').attributes('id')).toBe('especialidades')
    expect(wrapper.get('h2').text()).toBe('Especialidades')
    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(wrapper.findAll('h3').map((item) => item.text())).toEqual([
      'Taco gobernador',
      'Tostada de atún'
    ])
    expect(wrapper.text()).toContain(formatCurrency('149.00'))
    expect(wrapper.text()).toContain(formatCurrency('189.00'))
  })

  it('conserva una jerarquía estable cuando la categoría no tiene platillos', async () => {
    const category = buildPublicMenuCategory({
      name: 'Bebidas',
      items: []
    })

    const wrapper = await mountSuspended(MenuCategorySection, {
      props: {
        category
      }
    })

    expect(wrapper.get('section').exists()).toBe(true)
    expect(wrapper.get('h2').text()).toBe('Bebidas')
    expect(wrapper.text()).toContain('0 platillos')
    expect(wrapper.findAll('article')).toHaveLength(0)
  })

  it('sigue mostrando precio y descripción con textos largos', async () => {
    const category = buildPublicMenuCategory({
      items: [
        buildPublicMenuItem({
          name: 'Mollete de la casa',
          description:
            'Pan artesanal con frijol, queso gratinado, pico de gallo, aguacate, salsa macha y una porción generosa para compartir sin perder legibilidad en móvil.',
          price: '132.50'
        })
      ]
    })

    const wrapper = await mountSuspended(MenuCategorySection, {
      props: {
        category
      }
    })

    expect(wrapper.text()).toContain('Mollete de la casa')
    expect(wrapper.text()).toContain('Pan artesanal con frijol')
    expect(wrapper.text()).toContain(formatCurrency('132.50'))
  })
})
