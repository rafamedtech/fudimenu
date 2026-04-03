export function extractErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.') {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  const maybeError = error as {
    message?: string
    statusMessage?: string
    data?: {
      message?: string
      statusMessage?: string
    }
  }

  return (
    maybeError.data?.message ||
    maybeError.data?.statusMessage ||
    maybeError.statusMessage ||
    maybeError.message ||
    fallback
  )
}
