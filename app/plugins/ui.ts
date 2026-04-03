import { formatCurrency } from '~~/lib/formatters'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      formatPrice: formatCurrency
    }
  }
})
