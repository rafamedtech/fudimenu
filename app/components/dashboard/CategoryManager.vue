<script setup lang="ts">
import { extractErrorMessage } from '~~/lib/errors'
import type { DashboardCategoriesResponse } from '~~/types/api'
import type { DashboardMenuCategory } from '~~/types/domain'

interface CategoryFormState {
  name: string
  slug: string
  sortOrder: number
  isActive: boolean
}

const props = defineProps<{
  restaurantId: string
  categories: DashboardMenuCategory[]
}>()

const emit = defineEmits<{
  updated: [categories: DashboardMenuCategory[]]
}>()

const createForm = reactive<CategoryFormState>({
  name: '',
  slug: '',
  sortOrder: 0,
  isActive: true
})

const editForm = reactive<CategoryFormState>({
  name: '',
  slug: '',
  sortOrder: 0,
  isActive: true
})

const creating = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const createSlugTouched = ref(false)

const sortedCategories = computed(() =>
  props.categories
    .slice()
    .sort(
      (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'es-MX')
    )
)

const activeCategoriesCount = computed(
  () => props.categories.filter((category) => category.isActive).length
)
const inactiveCategoriesCount = computed(
  () => props.categories.filter((category) => !category.isActive).length
)
const isCreatingDisabled = computed(() => creating.value || !createForm.name.trim())
const isSavingDisabled = computed(() => saving.value || !editForm.name.trim())

watch(
  () => props.categories,
  (categories) => {
    if (!categories.length) {
      createForm.sortOrder = 0
      return
    }

    createForm.sortOrder = Math.max(...categories.map((category) => category.sortOrder)) + 1
  },
  {
    immediate: true
  }
)

watch(
  () => createForm.name,
  (name) => {
    if (!createSlugTouched.value) {
      createForm.slug = toSlug(name)
    }
  }
)

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function resetCreateForm() {
  createForm.name = ''
  createForm.slug = ''
  createForm.isActive = true
  createSlugTouched.value = false
}

function resetEditForm() {
  editForm.name = ''
  editForm.slug = ''
  editForm.sortOrder = 0
  editForm.isActive = true
}

function startEdit(category: DashboardMenuCategory) {
  editingId.value = category.id
  editForm.name = category.name
  editForm.slug = category.slug ?? ''
  editForm.sortOrder = category.sortOrder
  editForm.isActive = category.isActive
  errorMessage.value = null
  successMessage.value = null
}

function cancelEdit() {
  editingId.value = null
  resetEditForm()
}

async function createCategory() {
  creating.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardCategoriesResponse>(
      `/api/dashboard/restaurants/${props.restaurantId}/categories`,
      {
        method: 'POST',
        body: {
          name: createForm.name.trim(),
          slug: createForm.slug.trim(),
          sortOrder: createForm.sortOrder,
          isActive: createForm.isActive
        }
      }
    )

    emit('updated', response.categories)
    resetCreateForm()
    successMessage.value = 'Categoría creada.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos crear la categoría.')
  } finally {
    creating.value = false
  }
}

async function saveCategory() {
  if (!editingId.value) {
    return
  }

  saving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardCategoriesResponse>(
      `/api/dashboard/menu-categories/${editingId.value}`,
      {
        method: 'PATCH',
        body: {
          name: editForm.name.trim(),
          slug: editForm.slug.trim(),
          sortOrder: editForm.sortOrder,
          isActive: editForm.isActive
        }
      }
    )

    emit('updated', response.categories)
    editingId.value = null
    resetEditForm()
    successMessage.value = 'Categoría actualizada.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos actualizar la categoría.')
  } finally {
    saving.value = false
  }
}

async function removeCategory(categoryId: string) {
  if (!confirm('¿Eliminar esta categoría? También se eliminarán sus platillos.')) {
    return
  }

  deletingId.value = categoryId
  errorMessage.value = null
  successMessage.value = null

  try {
    const response = await $fetch<DashboardCategoriesResponse>(
      `/api/dashboard/menu-categories/${categoryId}`,
      {
        method: 'DELETE'
      }
    )

    emit('updated', response.categories)
    if (editingId.value === categoryId) {
      editingId.value = null
      resetEditForm()
    }
    successMessage.value = 'Categoría eliminada.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos eliminar la categoría.')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <section class="panel manager-section">
    <div class="section-stack">
      <p class="eyebrow">Categorías</p>
      <h2 class="manager-section__title">Ordena el menú por secciones</h2>
      <p class="section-copy">
        Crea categorías activas para lo público y organiza el orden de lectura desde aquí.
      </p>
      <div class="meta-row">
        <UiBadge tone="secondary">{{ activeCategoriesCount }} activas</UiBadge>
        <UiBadge tone="neutral">{{ inactiveCategoriesCount }} ocultas</UiBadge>
      </div>
    </div>

    <div v-if="errorMessage" class="feedback feedback--error">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="feedback feedback--success">
      {{ successMessage }}
    </div>

    <form class="manager-card manager-inline" @submit.prevent="createCategory">
      <h3 class="panel-title">Nueva categoría</h3>

      <div class="form-grid form-grid--2">
        <UiInput
          v-model="createForm.name"
          label="Nombre"
          required
          type="text"
        />

        <UiInput
          v-model="createForm.slug"
          label="Slug opcional"
          type="text"
          @update:model-value="createSlugTouched = true"
        />
      </div>

      <div class="form-grid form-grid--2">
        <UiInput
          v-model="createForm.sortOrder"
          label="Orden"
          min="0"
          number
          type="number"
        />

        <UiCheckbox
          v-model="createForm.isActive"
          description="Solo las categorías activas se muestran en el menú público."
          label="Visible en el menú público"
        />
      </div>

      <div class="button-row">
        <UiButton :disabled="isCreatingDisabled" type="submit">
          {{ creating ? 'Creando...' : 'Agregar categoría' }}
        </UiButton>
      </div>
    </form>

    <div v-if="!sortedCategories.length" class="empty-state">
      Todavía no hay categorías. Crea la primera para empezar a capturar tu menú.
    </div>

    <div v-else class="manager-list">
      <article v-for="category in sortedCategories" :key="category.id" class="manager-card">
        <template v-if="editingId === category.id">
          <form class="manager-inline" @submit.prevent="saveCategory">
            <div class="form-grid form-grid--2">
              <UiInput
                v-model="editForm.name"
                label="Nombre"
                required
                type="text"
              />

              <UiInput
                v-model="editForm.slug"
                label="Slug"
                type="text"
              />
            </div>

            <div class="form-grid form-grid--2">
              <UiInput
                v-model="editForm.sortOrder"
                label="Orden"
                min="0"
                number
                type="number"
              />

              <UiCheckbox
                v-model="editForm.isActive"
                description="Las categorías inactivas dejan de verse en la parte pública."
                label="Categoría activa"
              />
            </div>

            <div class="button-row">
              <UiButton :disabled="isSavingDisabled" type="submit">
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
              <h3 class="panel-title">{{ category.name }}</h3>
              <div class="meta-row">
                <UiBadge tone="neutral">Orden {{ category.sortOrder }}</UiBadge>
                <UiBadge tone="secondary">{{ category.itemCount }} platillos</UiBadge>
                <UiBadge :tone="category.isActive ? 'live' : 'danger'">
                  {{ category.isActive ? 'Activa' : 'Oculta' }}
                </UiBadge>
              </div>
              <p class="footer-note">
                {{ category.slug ? `Slug: ${category.slug}` : 'Sin slug manual' }}
              </p>
            </div>

            <div class="manager-card__actions">
              <UiButton
                :disabled="saving || deletingId !== null"
                intent="neutral"
                type="button"
                @click="startEdit(category)"
              >
                Editar
              </UiButton>
              <UiButton
                :disabled="saving || deletingId !== null"
                intent="danger"
                type="button"
                @click="removeCategory(category.id)"
              >
                {{ deletingId === category.id ? 'Eliminando...' : 'Eliminar' }}
              </UiButton>
            </div>
          </div>
        </template>
      </article>
    </div>
  </section>
</template>
