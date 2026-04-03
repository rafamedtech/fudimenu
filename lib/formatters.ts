export function formatCurrency(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatLocation(city?: string | null, zone?: string | null) {
  return [zone, city].filter(Boolean).join(', ')
}
