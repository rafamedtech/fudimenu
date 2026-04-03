<script setup lang="ts">
import { extractErrorMessage } from '~~/lib/errors'
import type { DashboardItemsResponse } from '~~/types/api'
import type { DashboardMenuCategory, DashboardMenuItem } from '~~/types/domain'

interface MenuItemFormState {
  categoryId: string
  name: string
  description: string
  price: string | number
  imageUrl: string
  isAvailable: boolean
  sortOrder: number
}

interface GroupedCategoryItems {
  category: DashboardMenuCategory
  items: DashboardMenuItem[]
}

const props = defineProps<{
  restaurantId: string
  categories: DashboardMenuCategory[]
  items: DashboardMenuItem[]
}>()

const emit = defineEmits<{
  updated: [items: DashboardMenuItem[]]
}>()

const { $formatPrice } = useNuxtApp()

const createForm = reactive<MenuItemFormState>({
  categoryId: '',
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  isAvailable: true,
  sortOrder: 0
})

const editForm = reactive<MenuItemFormState>({
  categoryId: '',
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  isAvailable: true,
  sortOrder: 0
})

const editingId = ref<string | null>(null)
const creating = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const availabilityId = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const sortedCategories = computed(() =>
  props.categories
    .slice()
    .sort(
      (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'es-MX')
    )
)

const sortedItems = computed(() =>
  props.items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'es-MX'))
)

const categoryOptions = computed(() =>
  sortedCategories.value.map((category) => ({
    label: category.name,
    value: category.id
  }))
)

const groupedItems = computed<GroupedCategoryItems[]>(() =>
  sortedCategories.value.map((category) => ({
    category,
    items: sortedItems.value.filter((item) => item.categoryId === category.id)
  }))
)

const availableItemsCount = computed(() => props.items.filter((item) => item.isAvailable).length)
const unavailableItemsCount = computed(() => props.items.length - availableItemsCount.value)
const isCreateDisabled = computed(
  () =>
    creating.value ||
    !createForm.categoryId ||
    !createForm.name.trim() ||
    !isPositivePrice(createForm.price)
)
const isSaveDisabled = computed(
  () =>
    saving.value ||
    !editForm.categoryId ||
    !editForm.name.trim() ||
    !isPositivePrice(editForm.price)
)

function isPositivePrice(value: string | number) {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0
}

function normalizeTextValue(value: string | number) {
  return typeof value === 'number' ? String(value) : value.trim()
}

function getItemsByCategory(categoryId: string) {
  return sortedItems.value.filter((item) => item.categoryId === categoryId)
}

function getNextSortOrder(categoryId: string) {
  const categoryItems = getItemsByCategory(categoryId)

  if (!categoryItems.length) {
    return 0
  }

  return Math.max(...categoryItems.map((item) => item.sortOrder)) + 1
}

function syncCreateFormCategory() {
  if (!sortedCategories.value.length) {
    createForm.categoryId = ''
    createForm.sortOrder = 0
    return
  }

  if (!sortedCategories.value.some((category) => category.id === createForm.categoryId)) {
    createForm.categoryId = sortedCategories.value[0]!.id
  }

  createForm.sortOrder = getNextSortOrder(createForm.categoryId)
}

watch(
  [sortedCategories, sortedItems, () => createForm.categoryId],
  syncCreateFormCategory,
  {
    immediate: true
  }
)

function resetCreateForm() {
  createForm.name = ''
  createForm.description = ''
  createForm.price = ''
  createForm.imageUrl = ''
  createForm.isAvailable = true
  createForm.sortOrder = getNextSortOrder(createForm.categoryId)
}

function resetEditForm() {
  editForm.categoryId = ''
  editForm.name = ''
  editForm.description = ''
  editForm.price = ''
  editForm.imageUrl = ''
  editForm.isAvailable = true
  editForm.sortOrder = 0
}

function buildPayload(form: MenuItemFormState) {
  return {
    categoryId: form.categoryId,
    name: form.name.trim(),
    description: form.description.trim(),
    price: normalizeTextValue(form.price),
    imageUrl: form.imageUrl.trim(),
    isAvailable: form.isAvailable,
    sortOrder: form.sortOrder
  }
}

function startEdit(item: DashboardMenuItem) {
  editingId.value = item.id
  editForm.categoryId = item.categoryId
  editForm.name = item.name
  editForm.description = item.description ?? ''
  editForm.price = item.price
  editForm.imageUrl = item.imageUrl ?? ''
  editForm.isAvailable = item.isAvailable
  editForm.sortOrder = item.sortOrder
  errorMessage.value = null
  successMessage.value = null
}

function cancelEdit() {
  editingId.value = null
  resetEditForm()
}

async function createItem() {
  if (isCreateDisabled.value) {
    return
  }

  creating.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardItemsResponse>(
      `/api/dashboard/restaurants/${props.restaurantId}/items`,
      {
        method: 'POST',
        body: buildPayload(createForm)
      }
    )

    emit('updated', response.items)
    resetCreateForm()
    successMessage.value = 'Platillo creado.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos crear el platillo.')
  } finally {
    creating.value = false
  }
}

async function saveItem() {
  if (!editingId.value || isSaveDisabled.value) {
    return
  }

  saving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardItemsResponse>(`/api/dashboard/items/${editingId.value}`, {
      method: 'PATCH',
      body: buildPayload(editForm)
    })

    emit('updated', response.items)
    editingId.value = null
    resetEditForm()
    successMessage.value = 'Platillo actualizado.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos actualizar el platillo.')
  } finally {
    saving.value = false
  }
}

async function removeItem(itemId: string) {
  if (!confirm('¿Eliminar este platillo?')) {
    return
  }

  deletingId.value = itemId
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardItemsResponse>(`/api/dashboard/items/${itemId}`, {
      method: 'DELETE'
    })

    emit('updated', response.items)
    if (editingId.value === itemId) {
      cancelEdit()
    }
    successMessage.value = 'Platillo eliminado.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos eliminar el platillo.')
  } finally {
    deletingId.value = null
  }
}

async function toggleAvailability(item: DashboardMenuItem) {
  availabilityId.value = item.id
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardItemsResponse>(`/api/dashboard/items/${item.id}`, {
      method: 'PATCH',
      body: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description ?? '',
        price: item.price,
        imageUrl: item.imageUrl ?? '',
        isAvailable: !item.isAvailable,
        sortOrder: item.sortOrder
      }
    })

    emit('updated', response.items)

    if (editingId.value === item.id) {
      editForm.isAvailable = !item.isAvailable
    }

    successMessage.value = item.isAvailable
      ? 'Platillo ocultado en la página pública.'
      : 'Platillo marcado como disponible.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos cambiar la disponibilidad.')
  } finally {
    availabilityId.value = null
  }
}
</script>

<template>
  <section class="panel manager-section">
    <div class="section-stack">
      <p class="eyebrow">Platillos</p>
      <h2 class="manager-section__title">Captura tu menú</h2>
      <p class="section-copy">
        Usa categorías activas para ordenar el menú y marca disponibilidad sin borrar historial.
      </p>
      <div class="meta-row">
        <UiBadge tone="secondary">{{ availableItemsCount }} disponibles</UiBadge>
        <UiBadge tone="neutral">{{ unavailableItemsCount }} ocultos</UiBadge>
      </div>
    </div>

    <div v-if="errorMessage" class="feedback feedback--error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback feedback--success">
      {{ successMessage }}
    </div>

    <div v-if="!categories.length" class="feedback feedback--muted">
      Primero crea al menos una categoría para poder agregar platillos.
    </div>

    <form v-else class="manager-card manager-inline" @submit.prevent="createItem">
      <h3 class="panel-title">Nuevo platillo</h3>

      <div class="form-grid form-grid--2">
        <UiSelect
          v-model="createForm.categoryId"
          :options="categoryOptions"
          label="Categoría"
          required
        />

        <UiInput
          v-model="createForm.name"
          label="Nombre"
          required
          type="text"
        />
      </div>

      <UiTextarea
        v-model="createForm.description"
        label="Descripción"
      />

      <div class="form-grid form-grid--2">
        <UiInput
          v-model="createForm.price"
          label="Precio"
          min="0.01"
          required
          step="0.01"
          type="number"
        />

        <UiInput
          v-model="createForm.sortOrder"
          label="Orden en la categoría"
          min="0"
          number
          type="number"
        />
      </div>

      <UiInput v-model="createForm.imageUrl" label="Imagen URL" type="url" />

      <UiCheckbox
        v-model="createForm.isAvailable"
        description="Los platillos no disponibles quedan guardados pero no se muestran al público."
        label="Disponible para mostrar en la página pública"
      />

      <div class="button-row">
        <UiButton :disabled="isCreateDisabled" type="submit">
          {{ creating ? 'Creando...' : 'Agregar platillo' }}
        </UiButton>
      </div>
    </form>

    <div v-if="!props.items.length" class="empty-state">
      Aún no hay platillos registrados.
    </div>

    <div v-else class="manager-list">
      <section
        v-for="group in groupedItems"
        :key="group.category.id"
        class="manager-card manager-inline"
      >
        <div class="manager-card__header">
          <div class="section-stack">
            <h3 class="panel-title">{{ group.category.name }}</h3>
            <div class="meta-row">
              <UiBadge tone="secondary">{{ group.items.length }} platillos</UiBadge>
              <UiBadge tone="neutral">Orden {{ group.category.sortOrder }}</UiBadge>
              <UiBadge :tone="group.category.isActive ? 'live' : 'danger'">
                {{ group.category.isActive ? 'Activa' : 'Oculta en público' }}
              </UiBadge>
            </div>
          </div>
        </div>

        <div v-if="!group.items.length" class="empty-state">
          Esta categoría todavía no tiene platillos.
        </div>

        <div v-else class="manager-list">
          <article v-for="item in group.items" :key="item.id" class="manager-card">
            <template v-if="editingId === item.id">
              <form class="manager-inline" @submit.prevent="saveItem">
                <div class="form-grid form-grid--2">
                  <UiSelect
                    v-model="editForm.categoryId"
                    :options="categoryOptions"
                    label="Categoría"
                    required
                  />

                  <UiInput
                    v-model="editForm.name"
                    label="Nombre"
                    required
                    type="text"
                  />
                </div>

                <UiTextarea
                  v-model="editForm.description"
                  label="Descripción"
                />

                <div class="form-grid form-grid--2">
                  <UiInput
                    v-model="editForm.price"
                    label="Precio"
                    min="0.01"
                    required
                    step="0.01"
                    type="number"
                  />

                  <UiInput
                    v-model="editForm.sortOrder"
                    label="Orden en la categoría"
                    min="0"
                    number
                    type="number"
                  />
                </div>

                <UiInput v-model="editForm.imageUrl" label="Imagen URL" type="url" />

                <UiCheckbox
                  v-model="editForm.isAvailable"
                  description="Desactívalo para ocultarlo sin perder la captura."
                  label="Platillo disponible"
                />

                <div class="button-row">
                  <UiButton :disabled="isSaveDisabled" type="submit">
                    {{ saving ? 'Guardando...' : 'Guardar cambios' }}
                  </UiButton>
                  <UiButton :disabled="saving" intent="neutral" type="button" @click="cancelEdit">
                    Cancelar
                  </UiButton>
                </div>
              </form>
            </template>

            <template v-else>
              <div class="manager-card__header">
                <div class="section-stack">
                  <h4 class="panel-title">{{ item.name }}</h4>
                  <div class="meta-row">
                    <UiBadge tone="neutral">Orden {{ item.sortOrder }}</UiBadge>
                    <UiBadge :tone="item.isAvailable ? 'live' : 'danger'">
                      {{ item.isAvailable ? 'Disponible' : 'No disponible' }}
                    </UiBadge>
                  </div>
                  <p class="menu-item__description">
                    {{ item.description || 'Sin descripción corta.' }}
                  </p>
                  <p class="menu-item__price">{{ $formatPrice(item.price) }}</p>
                </div>

                <div class="manager-card__actions">
                  <UiButton
                    :disabled="creating || saving || deletingId !== null || availabilityId !== null"
                    intent="neutral"
                    type="button"
                    @click="toggleAvailability(item)"
                  >
                    {{
                      availabilityId === item.id
                        ? 'Actualizando...'
                        : item.isAvailable
                          ? 'Marcar no disponible'
                          : 'Marcar disponible'
                    }}
                  </UiButton>
                  <UiButton
                    :disabled="creating || saving || deletingId !== null || availabilityId !== null"
                    intent="neutral"
                    type="button"
                    @click="startEdit(item)"
                  >
                    Editar
                  </UiButton>
                  <UiButton
                    :disabled="creating || saving || deletingId !== null || availabilityId !== null"
                    intent="danger"
                    type="button"
                    @click="removeItem(item.id)"
                  >
                    {{ deletingId === item.id ? 'Eliminando...' : 'Eliminar' }}
                  </UiButton>
                </div>
              </div>
            </template>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>
