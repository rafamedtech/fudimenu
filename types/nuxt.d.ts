declare module '#app' {
  interface NuxtApp {
    $formatPrice: (value: number | string) => string
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $formatPrice: (value: number | string) => string
  }
}

export {}
