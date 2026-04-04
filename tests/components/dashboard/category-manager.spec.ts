import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import CategoryManager from '~/components/dashboard/CategoryManager.vue'

import { buildDashboardMenuCategory } from '~~/tests/factories/domain'
import { getButton, getControl, setFieldValue } from '~~/tests/setup/component-helpers'

describe('CategoryManager', () => {
  it('muestra estado vacío y mantiene el submit deshabilitado hasta capturar nombre', async () => {
    const wrapper = await mountSuspended(CategoryManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: []
      }
    })

    expect(wrapper.text()).toContain('0 activas')
    expect(wrapper.text()).toContain('0 ocultas')
    expect(wrapper.text()).toContain('Todavía no hay categorías')
    expect((getButton(wrapper, 'Agregar categoría').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('autogenera slug y emite categorías actualizadas al crear una nueva', async () => {
    const categories = [
      buildDashboardMenuCategory({
        id: 'category-entradas',
        restaurantId: 'restaurant-brasa',
        name: 'Entradas',
        slug: 'entradas',
        sortOrder: 0,
        itemCount: 2
      })
    ]
    const fetchMock = vi.fn().mockResolvedValue({ categories })
    vi.stubGlobal('$fetch', fetchMock)

    const wrapper = await mountSuspended(CategoryManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: []
      }
    })

    await setFieldValue(wrapper, 'Nombre', 'Entradas')
    expect((getControl(wrapper, 'Slug opcional').element as HTMLInputElement).value).toBe('entradas')

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/dashboard/restaurants/restaurant-brasa/categories', {
      method: 'POST',
      body: {
        name: 'Entradas',
        slug: 'entradas',
        sortOrder: 0,
        isActive: true
      }
    })
    expect(wrapper.emitted('updated')?.[0]?.[0]).toEqual(categories)
    expect(wrapper.text()).toContain('Categoría creada.')
  })

  it('presenta categorías existentes con sus métricas y acciones', async () => {
    const wrapper = await mountSuspended(CategoryManager, {
      props: {
        restaurantId: 'restaurant-brasa',
        categories: [
          buildDashboardMenuCategory({
            name: 'Entradas',
            sortOrder: 0,
            itemCount: 3,
            isActive: true
          }),
          buildDashboardMenuCategory({
            name: 'Postres',
            slug: null,
            sortOrder: 1,
            itemCount: 0,
            isActive: false
          })
        ]
      }
    })

    expect(wrapper.text()).toContain('1 activas')
    expect(wrapper.text()).toContain('1 ocultas')
    expect(wrapper.text()).toContain('Entradas')
    expect(wrapper.text()).toContain('3 platillos')
    expect(wrapper.text()).toContain('Postres')
    expect(wrapper.text()).toContain('Sin slug manual')
    expect(wrapper.findAll('button').map((button) => button.text())).toContain('Editar')
  })
})
