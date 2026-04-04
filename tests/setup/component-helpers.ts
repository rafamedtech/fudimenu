import { flushPromises, type DOMWrapper, type VueWrapper } from '@vue/test-utils'

type TestWrapper = VueWrapper<unknown>

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function getField(wrapper: TestWrapper, labelText: string) {
  const field = wrapper.findAll('.ui-field').find((candidate) => {
    const label = candidate.find('.field__label')

    return label.exists() && normalizeText(label.text()) === normalizeText(labelText)
  })

  if (!field) {
    throw new Error(`No se encontró el field "${labelText}".`)
  }

  return field
}

export function getControl(wrapper: TestWrapper, labelText: string) {
  const field = getField(wrapper, labelText)
  const control = field.find('input:not([type="hidden"]), textarea, select')

  if (!control.exists()) {
    throw new Error(`No se encontró un control para el field "${labelText}".`)
  }

  return control as DOMWrapper<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
}

export async function setFieldValue(wrapper: TestWrapper, labelText: string, value: string | number) {
  const control = getControl(wrapper, labelText)

  await control.setValue(value)
  await flushPromises()

  return control
}

export function getButton(wrapper: TestWrapper, labelText: string) {
  const button = wrapper.findAll('button').find((candidate) => {
    return normalizeText(candidate.text()) === normalizeText(labelText)
  })

  if (!button) {
    throw new Error(`No se encontró el botón "${labelText}".`)
  }

  return button as DOMWrapper<HTMLButtonElement>
}

export async function clickButton(wrapper: TestWrapper, labelText: string) {
  const button = getButton(wrapper, labelText)

  await button.trigger('click')
  await flushPromises()

  return button
}

export function getCheckbox(wrapper: TestWrapper, labelText: string) {
  const checkboxLabel = wrapper.findAll('label.ui-checkbox').find((candidate) => {
    return normalizeText(candidate.text()).includes(normalizeText(labelText))
  })

  if (!checkboxLabel) {
    throw new Error(`No se encontró el checkbox "${labelText}".`)
  }

  const input = checkboxLabel.find('input[type="checkbox"]')

  if (!input.exists()) {
    throw new Error(`No se encontró el input del checkbox "${labelText}".`)
  }

  return input as DOMWrapper<HTMLInputElement>
}

export async function setCheckboxValue(wrapper: TestWrapper, labelText: string, checked: boolean) {
  const checkbox = getCheckbox(wrapper, labelText)

  if (checkbox.element.checked !== checked) {
    await checkbox.setValue(checked)
    await flushPromises()
  }

  return checkbox
}
