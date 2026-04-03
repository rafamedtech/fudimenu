<template>
  <article class="restaurant-card surface-card">
    <USkeleton class="restaurant-card__cover restaurant-card__cover--skeleton" />

    <div class="restaurant-card__content">
      <div class="button-row restaurant-card__tags">
        <USkeleton class="restaurant-card__chip-skeleton" />
        <USkeleton class="restaurant-card__chip-skeleton restaurant-card__chip-skeleton--wide" />
      </div>

      <div class="section-stack restaurant-card__body">
        <USkeleton class="restaurant-card__title-skeleton" />
        <USkeleton class="restaurant-card__line-skeleton" />
        <USkeleton class="restaurant-card__line-skeleton restaurant-card__line-skeleton--short" />
      </div>

      <div class="restaurant-card__footer">
        <USkeleton class="restaurant-card__cta-skeleton" />
      </div>
    </div>
  </article>
</template>
