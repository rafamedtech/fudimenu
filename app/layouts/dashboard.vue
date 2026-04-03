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
    <UHeader
      class="site-shell-header dashboard-shell-header"
      :ui="{
        root: 'site-shell-header__root dashboard-shell-header__root',
        container: 'site-shell-header__container',
        center: 'min-w-0',
        right: 'site-shell-header__right',
        body: 'site-shell-header__body'
      }"
    >
      <template #title>
        <SharedAppLogo caption="Dashboard para dueños" />
      </template>

      <SharedDashboardNavigation class="hidden lg:flex" compact orientation="horizontal" />

      <template #right>
        <div class="header-actions">
          <UiBadge class="account-badge hidden xl:inline-flex" tone="secondary">
            {{ accountLabel }}
          </UiBadge>

          <SharedThemeCustomizer />

          <UiButton
            to="/"
            :icon="appIcons.globe"
            class="hidden md:inline-flex"
            intent="ghost"
            size="sm"
          >
            Ver sitio público
          </UiButton>

          <UiButton :icon="appIcons.logout" intent="neutral" size="sm" @click="signOut()">
            <span class="hidden sm:inline">Cerrar sesión</span>
          </UiButton>
        </div>
      </template>

      <template #body>
        <div class="header-mobile-panel">
          <UiBadge class="justify-start" tone="secondary">
            {{ accountLabel }}
          </UiBadge>

          <SharedDashboardNavigation compact orientation="vertical" />

          <div class="header-mobile-panel__actions">
            <SharedThemeCustomizer />

            <UiButton to="/" :icon="appIcons.globe" block intent="ghost">
              Ver sitio público
            </UiButton>

            <UiButton :icon="appIcons.logout" block intent="neutral" @click="signOut()">
              Cerrar sesión
            </UiButton>
          </div>
        </div>
      </template>
    </UHeader>

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
