<template>
  <main class="relative flex w-full justify-between lg:pt-0">
    <section class="hidden justify-between lg:flex lg:w-1/6">
      <!-- <SideBar :items="navLinks" /> -->
    </section>

    <div class="flex-auto transition-all lg:w-5/6">
      <TopBar />
      <UContainer
        :ui="{ constrained: 'max-w-full' }"
        class="min-h-screen bg-gray-100 dark:bg-neutral-800 transition-colors lg:relative lg:px-12"
      >
        <slot> </slot>
      </UContainer>

      <BottomNavbar :items="navLinks" class="lg:hidden" />

      <!-- <FeaturedEvent /> -->
    </div>
  </main>
</template>
