export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorLocale = 'es' | 'en';

const DEFAULT_LOCALE: ErrorLocale = 'es';

const ERROR_MESSAGES = {
  es: {
    unauthorized: 'Necesitas iniciar sesión.',
    forbidden: 'No tienes permiso.',
    not_found: 'No encontrado.',
    validation: 'Revisa los datos.',
    rate_limited: 'Demasiados intentos, espera un momento.',
    server_error: 'Algo falló. Intenta de nuevo.',
    network: 'Sin internet.',
    fallback: 'Algo no salió.',
    retry: 'Algo no salió. Reintenta.',
  },
  en: {
    unauthorized: 'You need to sign in.',
    forbidden: "You don't have permission.",
    not_found: 'Not found.',
    validation: 'Check the details.',
    rate_limited: 'Too many attempts, wait a moment.',
    server_error: 'Something failed. Try again.',
    network: 'No internet connection.',
    fallback: 'Something went wrong.',
    retry: 'Something went wrong. Retry.',
  },
};

function normalizeErrorLocale(locale?: string): ErrorLocale {
  return locale?.startsWith('en') ? 'en' : DEFAULT_LOCALE;
}

export function toUserMessage(err: unknown, locale?: string): string {
  const messages = ERROR_MESSAGES[normalizeErrorLocale(locale)];

  if (err instanceof ApiError) {
    return messages[err.code as keyof typeof messages] ?? err.message ?? messages.fallback;
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return messages.network;
  }
  return messages.retry;
}
