<script setup lang="ts">
import type { PublicMenuCategory } from '~~/types/domain'

const props = defineProps<{
  category: PublicMenuCategory
  sectionId?: string
}>()

const { $formatPrice } = useNuxtApp()

const itemCountLabel = computed(() =>
  `${props.category.items.length} platillo${props.category.items.length === 1 ? '' : 's'}`
)
</script>

<template>
  <section :id="sectionId" class="menu-category surface-card">
    <header class="menu-category__header">
      <div class="menu-category__title-block">
        <div class="button-row">
          <UiBadge tone="primary">
            Categoria activa
          </UiBadge>
          <UiBadge tone="secondary">
            {{ itemCountLabel }}
          </UiBadge>
        </div>

        <h2 class="card-title">{{ category.name }}</h2>
      </div>
    </header>

    <div class="menu-items">
      <article v-for="item in category.items" :key="item.id" class="menu-item">
        <div class="menu-item__top">
          <div class="menu-item__content">
            <h3 class="menu-item__name">{{ item.name }}</h3>
            <p v-if="item.description" class="menu-item__description">
              {{ item.description }}
            </p>
          </div>

          <p class="menu-item__price">{{ $formatPrice(item.price) }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
