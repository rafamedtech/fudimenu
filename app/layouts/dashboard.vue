<script setup lang="ts">
const { supabaseUser, appUser, refreshAppUser, signOut } = useAuthUser()
const { appIcons } = useSiteTheme()

const accountLabel = computed(() => {
  return appUser.value?.fullName || supabaseUser.value?.email || 'Tu cuenta'
})

if (supabaseUser.value && !appUser.value) {
  refreshAppUser().catch(() => undefined)
}
</script>

<template>
  <div class="app-shell app-shell--dashboard">
    <header class="layout-header layout-header--dashboard">
      <div class="container">
        <UiCard class="layout-card layout-card--dashboard" padding="none">
          <div class="layout-card__inner">
            <div class="layout-card__bar">
              <SharedAppLogo caption="Dashboard para dueños" />

              <div class="layout-card__actions">
                <UiBadge class="account-badge" tone="secondary">
                  {{ accountLabel }}
                </UiBadge>

                <SharedThemeCustomizer />

                <UiButton to="/" :icon="appIcons.globe" intent="ghost" size="sm">
                  Ver sitio público
                </UiButton>

                <UiButton :icon="appIcons.logout" intent="neutral" size="sm" @click="signOut()">
                  Cerrar sesión
                </UiButton>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </header>

    <main class="page-shell">
      <div class="container dashboard-layout">
        <aside class="dashboard-layout__aside">
          <UiCard class="dashboard-sidebar-card" padding="none">
            <div class="dashboard-sidebar-card__content">
              <div class="section-stack">
                <p class="eyebrow">Panel privado</p>
                <h2 class="dashboard-sidebar-card__title">Gestiona tus restaurantes</h2>
                <p class="section-copy">
                  Mantén tu perfil publicado, ordena categorías y actualiza disponibilidad de
                  platillos.
                </p>
              </div>

              <UiBadge class="dashboard-sidebar-card__badge" tone="secondary">
                {{ accountLabel }}
              </UiBadge>

              <SharedDashboardNavigation />

              <UiButton to="/dashboard/restaurants" block :icon="appIcons.store">
                Ir a tus restaurantes
              </UiButton>
            </div>
          </UiCard>
        </aside>

        <section class="dashboard-main">
          <div class="dashboard-main__content">
            <slot />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
