import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import MenuItemManager from '~/components/dashboard/MenuItemManager.vue'

import { formatCurrency } from '~~/lib/formatters'
import { buildDashboardMenuCategory, buildDashboardMenuItem } from '~~/tests/factories/domain'
import { getButton, getControl, setFieldValue } from '~~/tests/setup/component-helpers'

describe('MenuItemManager', () => {
  it('muestra un guard claro cuando todavía no existen categorías', async () => {
    const wrapper = await mountSuspended(MenuItemManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: [],
        items: []
      }
    })

    expect(wrapper.text()).toContain('Primero crea al menos una categoría')
    expect(wrapper.text()).toContain('Aún no hay platillos registrados.')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('renderiza nombre, descripción, precio y estado de los platillos existentes', async () => {
    const category = buildDashboardMenuCategory({
      id: 'category-especiales',
      name: 'Especiales',
      sortOrder: 0,
      isActive: true
    })
    const item = buildDashboardMenuItem({
      categoryId: category.id,
      categoryName: category.name,
      name: 'Mollete de la casa',
      description:
        'Pan artesanal con frijol, queso, aguacate y salsa macha en una porción amplia para compartir.',
      price: '132.50',
      isAvailable: false
    })

    const wrapper = await mountSuspended(MenuItemManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: [category],
        items: [item]
      }
    })

    expect(wrapper.text()).toContain('Especiales')
    expect(wrapper.text()).toContain('Mollete de la casa')
    expect(wrapper.text()).toContain('Pan artesanal con frijol')
    expect(wrapper.text()).toContain(formatCurrency('132.50'))
    expect(wrapper.text()).toContain('No disponible')
    expect(wrapper.text()).toContain('Marcar disponible')
  })

  it('mantiene el create deshabilitado hasta tener nombre y precio válidos, y emite items actualizados', async () => {
    const category = buildDashboardMenuCategory({
      id: 'category-tacos',
      name: 'Tacos',
      sortOrder: 0
    })
    const items = [
      buildDashboardMenuItem({
        id: 'item-taco-1',
        categoryId: category.id,
        categoryName: category.name,
        name: 'Taco gobernador',
        sortOrder: 0
      })
    ]
    const fetchMock = vi.fn().mockResolvedValue({ items })
    vi.stubGlobal('$fetch', fetchMock)

    const wrapper = await mountSuspended(MenuItemManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: [category],
        items: []
      }
    })

    const submitButton = getButton(wrapper, 'Agregar platillo')

    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)

    await setFieldValue(wrapper, 'Nombre', 'Taco gobernador')
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)

    await setFieldValue(wrapper, 'Precio', '149')
    expect((getControl(wrapper, 'Categoría').element as HTMLSelectElement).value).toBe(category.id)
    expect((submitButton.element as HTMLButtonElement).disabled).toBe(false)

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/dashboard/restaurants/restaurant-brasa/items', {
      method: 'POST',
      body: {
        categoryId: category.id,
        name: 'Taco gobernador',
        description: '',
        price: '149',
        imageUrl: '',
        isAvailable: true,
        sortOrder: 0
      }
    })
    expect(wrapper.emitted('updated')?.[0]?.[0]).toEqual(items)
    expect(wrapper.text()).toContain('Platillo creado.')
  })
})
