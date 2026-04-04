<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: ''
  }
)

const slots = useSlots()

const hasToolbar = computed(() => Boolean(slots['toolbar-left'] || slots['toolbar-right']))
</script>

<template>
  <UDashboardPanel
    class="dashboard-page-panel"
    :ui="{
      body: 'dashboard-page-panel__body'
    }"
  >
    <template #header>
      <UDashboardNavbar :toggle="false" :title="props.title">
        <template #left>
          <div class="flex min-w-0 items-center gap-2">
            <UDashboardSidebarToggle class="lg:hidden" />
            <UDashboardSidebarCollapse class="hidden lg:inline-flex" />

            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-highlighted">
                {{ props.title }}
              </p>
              <p v-if="props.description" class="hidden truncate text-sm text-muted md:block">
                {{ props.description }}
              </p>
            </div>
          </div>
        </template>

        <template #right>
          <slot name="actions" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar v-if="hasToolbar">
        <template #left>
          <slot name="toolbar-left" />
        </template>

        <template #right>
          <slot name="toolbar-right" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
