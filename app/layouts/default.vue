<script setup lang="ts">
const { isAuthenticated, signOut } = useAuthUser()
const { appIcons } = useSiteTheme()
</script>

<template>
  <div class="app-shell app-shell--public">
    <header class="layout-header">
      <div class="container">
        <UiCard class="layout-card" padding="none">
          <div class="layout-card__inner">
            <div class="layout-card__bar">
              <SharedAppLogo caption="Menús claros para decidir rápido" />

              <div class="layout-card__actions">
                <SharedPublicNavigation :is-authenticated="isAuthenticated" />

                <SharedThemeCustomizer />

                <UiButton
                  v-if="isAuthenticated"
                  :icon="appIcons.logout"
                  intent="neutral"
                  size="sm"
                  @click="signOut()"
                >
                  Cerrar sesión
                </UiButton>
              </div>
            </div>

            <div class="layout-card__support">
              <p class="layout-card__copy">
                Descubre restaurantes publicados y revisa menús desde el celular sin perder tiempo.
              </p>

              <UiBadge tone="secondary">
                Mobile-first
              </UiBadge>
            </div>
          </div>
        </UiCard>
      </div>
    </header>

    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>
