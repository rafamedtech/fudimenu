import { mockComponent, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { describe, expect, it } from 'vitest'

import RestaurantForm from '~/components/dashboard/RestaurantForm.vue'

import { buildDashboardRestaurant } from '~~/tests/factories/domain'
import { getButton, getControl, getField, setFieldValue } from '~~/tests/setup/component-helpers'

mockComponent('DashboardRestaurantThemeSection', {
  props: ['modelValue', 'restaurantName'],
  setup() {
    return () =>
      h(
        'div',
        {
          class: 'rounded-2xl border border-default/60 bg-muted/40 p-4'
        },
        'Theme section stub'
      )
  }
})

describe('DashboardRestaurantForm', () => {
  it('renderiza inputs principales con labels y acciones visibles', async () => {
    const wrapper = await mountSuspended(RestaurantForm)
    const nameLabel = getField(wrapper, 'Nombre').get('label')
    const nameControl = getControl(wrapper, 'Nombre')

    expect(nameLabel.attributes('for')).toBe(nameControl.attributes('id'))
    expect(getControl(wrapper, 'Nombre').exists()).toBe(true)
    expect(getControl(wrapper, 'Slug').exists()).toBe(true)
    expect(getControl(wrapper, 'Descripción').exists()).toBe(true)
    expect(getButton(wrapper, 'Guardar borrador').exists()).toBe(true)
    expect(getButton(wrapper, 'Crear y publicar').exists()).toBe(true)
  })

  it('autogenera el slug desde el nombre hasta que el usuario lo edita manualmente', async () => {
    const wrapper = await mountSuspended(RestaurantForm)

    await setFieldValue(wrapper, 'Nombre', 'Taquería Sol Norte')
    expect((getControl(wrapper, 'Slug').element as HTMLInputElement).value).toBe('taqueria-sol-norte')

    await setFieldValue(wrapper, 'Slug', 'sol-norte-manual')
    await setFieldValue(wrapper, 'Nombre', 'Otro nombre')

    expect((getControl(wrapper, 'Slug').element as HTMLInputElement).value).toBe('sol-norte-manual')
  })

  it('emite payload normalizado al guardar borrador y al publicar', async () => {
    const wrapper = await mountSuspended(RestaurantForm)

    await setFieldValue(wrapper, 'Nombre', '  Casa Ñora  ')
    await setFieldValue(wrapper, 'Descripción', '  Cocina de temporada.  ')
    await setFieldValue(wrapper, 'Ciudad', '  Tijuana  ')
    await setFieldValue(wrapper, 'Zona', '  Zona Río  ')

    await getButton(wrapper, 'Guardar borrador').trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('submit')

    expect(emitted).toBeTruthy()
    expect(emitted?.[0]?.[1]).toBe('draft')
    expect(emitted?.[0]?.[0]).toMatchObject({
      name: 'Casa Ñora',
      slug: 'casa-nora',
      description: 'Cocina de temporada.',
      city: 'Tijuana',
      zone: 'Zona Río',
      isPublished: false
    })

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.emitted('submit')?.[1]?.[1]).toBe('publish')
    expect(wrapper.emitted('submit')?.[1]?.[0]).toMatchObject({
      isPublished: true,
      slug: 'casa-nora'
    })
  })

  it('muestra el estado actual y el error cuando recibe datos existentes', async () => {
    const wrapper = await mountSuspended(RestaurantForm, {
      props: {
        restaurant: buildDashboardRestaurant({
          isPublished: true
        }),
        errorMessage: 'No pudimos guardar el restaurante.'
      }
    })

    expect(wrapper.text()).toContain('Publicado')
    expect(wrapper.text()).toContain('No pudimos guardar el restaurante.')
    expect(getButton(wrapper, 'Guardar como borrador').exists()).toBe(true)
    expect(getButton(wrapper, 'Guardar cambios').exists()).toBe(true)
  })
})
