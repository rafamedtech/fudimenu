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

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Necesitas iniciar sesión.',
  forbidden: 'No tienes permiso.',
  not_found: 'No encontrado.',
  validation: 'Revisa los datos.',
  rate_limited: 'Demasiados intentos, espera un momento.',
  server_error: 'Algo falló. Intenta de nuevo.',
  network: 'Sin internet.',
};

export function toUserMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return ERROR_MESSAGES[err.code] ?? err.message ?? 'Algo no salió.';
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return ERROR_MESSAGES.network;
  }
  return 'Algo no salió. Reintenta.';
}
