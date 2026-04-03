<script setup lang="ts">
const { isAuthenticated, signOut } = useAuthUser()
const { appIcons } = useSiteTheme()
</script>

<template>
  <div class="app-shell app-shell--public">
    <UHeader
      class="site-shell-header"
      :ui="{
        root: 'site-shell-header__root',
        container: 'site-shell-header__container',
        center: 'min-w-0',
        right: 'site-shell-header__right',
        body: 'site-shell-header__body'
      }"
    >
      <template #title>
        <SharedAppLogo caption="Menús claros para decidir rápido" />
      </template>

      <SharedPublicNavigation class="hidden lg:flex" :is-authenticated="isAuthenticated" />

      <template #right>
        <div class="header-actions">
          <SharedThemeCustomizer />

          <UiButton
            v-if="isAuthenticated"
            :icon="appIcons.logout"
            class="hidden sm:inline-flex"
            intent="neutral"
            size="sm"
            @click="signOut()"
          >
            Cerrar sesión
          </UiButton>
        </div>
      </template>

      <template #body>
        <div class="header-mobile-panel">
          <SharedPublicNavigation :is-authenticated="isAuthenticated" orientation="vertical" />

          <div class="header-mobile-panel__actions">
            <SharedThemeCustomizer />

            <UiButton
              v-if="isAuthenticated"
              :icon="appIcons.logout"
              block
              intent="neutral"
              @click="signOut()"
            >
              Cerrar sesión
            </UiButton>
          </div>
        </div>
      </template>

    </UHeader>

    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>
