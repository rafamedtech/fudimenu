type HeaderMap = Record<string, unknown>;

type SentryLikeEvent = {
  user?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  request?: {
    cookies?: unknown;
    headers?: HeaderMap;
  };
};

const SENSITIVE_USER_FIELDS = ['email', 'ip', 'ip_address'];
const SENSITIVE_HEADER_NAMES = ['authorization', 'cookie', 'x-forwarded-for', 'x-real-ip'];

function scrubUser(user: Record<string, unknown> | undefined) {
  if (!user) return;

  for (const field of SENSITIVE_USER_FIELDS) {
    delete user[field];
  }
}

function scrubHeaders(headers: HeaderMap | undefined) {
  if (!headers) return;

  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADER_NAMES.includes(key.toLowerCase())) {
      delete headers[key];
    }
  }
}

export function scrubSentryEvent<T extends SentryLikeEvent>(event: T): T {
  scrubUser(event.user);

  const userContext = event.contexts?.user;
  if (userContext && typeof userContext === 'object' && !Array.isArray(userContext)) {
    scrubUser(userContext as Record<string, unknown>);
  }

  if (event.request) {
    delete event.request.cookies;
    scrubHeaders(event.request.headers);
  }

  return event;
}
