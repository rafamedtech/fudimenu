<script setup lang="ts">
const { supabaseUser, appUser, refreshAppUser, signOut } = useAuthUser()
const { appIcons } = useSiteTheme()

const mobileOpen = ref(false)

const accountLabel = computed(() => {
  return appUser.value?.fullName || supabaseUser.value?.email || 'Tu cuenta'
})

const accountRoleLabel = computed(() => {
  if (appUser.value?.role === 'ADMIN') {
    return 'Administrador'
  }

  if (appUser.value?.role === 'RESTAURANT_OWNER') {
    return 'Restaurant owner'
  }

  return 'Cuenta autenticada'
})

if (supabaseUser.value && !appUser.value) {
  refreshAppUser().catch(() => undefined)
}
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="owner-dashboard"
      v-model:open="mobileOpen"
      class="dashboard-sidebar-shell bg-elevated/25"
      collapsible
      resizable
      :default-size="18"
      :max-size="20"
      :min-size="15"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="dashboard-sidebar-brand">
          <NuxtLink class="brand-link min-w-0" to="/dashboard">
            <span class="brand-mark">FM</span>

            <span v-if="!collapsed" class="brand-copy">
              <span class="brand-title">FudiMenu</span>
              <span class="brand-caption">Dashboard para dueños</span>
            </span>
          </NuxtLink>

          <UiBadge
            v-if="!collapsed"
            class="dashboard-sidebar-brand__badge"
            tone="secondary"
          >
            Administración
          </UiBadge>
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex min-h-full flex-1 flex-col gap-5">
          <div v-if="!collapsed" class="dashboard-workspace-card">
            <p class="dashboard-workspace-card__eyebrow">
              Workspace
            </p>
            <h2 class="dashboard-workspace-card__title">
              Gestión de restaurantes y menús
            </h2>
            <p class="dashboard-workspace-card__copy">
              Edita perfiles, organiza categorías y mantén la disponibilidad del menú al día.
            </p>
          </div>

          <SharedDashboardNavigation :collapsed="collapsed" />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <div
          class="dashboard-sidebar-footer"
          :class="{ 'dashboard-sidebar-footer--collapsed': collapsed }"
        >
          <div v-if="!collapsed" class="dashboard-sidebar-footer__account">
            <p class="dashboard-sidebar-footer__name">
              {{ accountLabel }}
            </p>
            <p class="dashboard-sidebar-footer__role">
              {{ accountRoleLabel }}
            </p>
          </div>

          <div class="dashboard-sidebar-footer__actions">
            <SharedThemeCustomizer />

            <UiButton
              to="/"
              :icon="appIcons.globe"
              :class="collapsed ? 'w-10 justify-center px-0' : 'w-full justify-start'"
              intent="ghost"
              size="sm"
            >
              <span v-if="!collapsed">Ver sitio público</span>
            </UiButton>

            <UiButton
              :icon="appIcons.logout"
              :class="collapsed ? 'w-10 justify-center px-0' : 'w-full justify-start'"
              intent="neutral"
              size="sm"
              @click="signOut()"
            >
              <span v-if="!collapsed">Cerrar sesión</span>
            </UiButton>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
