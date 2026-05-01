const CACHE_VERSION = 'v1';
const STATIC_CACHE = `fudimenu-static-${CACHE_VERSION}`;
const ADMIN_CACHE = `fudimenu-admin-${CACHE_VERSION}`;

const ADMIN_SHELL_URLS = ['/dashboard', '/menu', '/analytics', '/settings'];
const STATIC_PATH_PREFIXES = ['/_next/static/', '/icon', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    warmAdminShell()
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fudimenu-') && ![STATIC_CACHE, ADMIN_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate' || isAdminPath(url.pathname)) {
    event.respondWith(networkFirstAdmin(request));
  }
});

async function warmAdminShell() {
  const cache = await caches.open(ADMIN_CACHE);
  await Promise.allSettled(
    ADMIN_SHELL_URLS.map(async (path) => {
      const request = new Request(path, { credentials: 'same-origin' });
      const response = await fetch(request);

      if (response.ok && isHtmlResponse(response)) {
        await cache.put(request, response.clone());
      }
    }),
  );
}

function isStaticAsset(request, url) {
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    STATIC_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  );
}

function isAdminPath(pathname) {
  return ADMIN_SHELL_URLS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isHtmlResponse(response) {
  return response.headers.get('content-type')?.includes('text/html');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const fallback = await cache.match(request);
    if (fallback) return fallback;
    throw error;
  }
}

async function networkFirstAdmin(request) {
  const cache = await caches.open(ADMIN_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok && isHtmlResponse(response)) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);
    const shell = cached ?? (await firstCachedAdminShell(cache));

    if (shell && isHtmlResponse(shell)) {
      return withOfflineBanner(shell);
    }

    if (shell) return shell;
    throw error;
  }
}

async function firstCachedAdminShell(cache) {
  for (const path of ADMIN_SHELL_URLS) {
    const cached = await cache.match(path);
    if (cached) return cached;
  }

  return null;
}

async function withOfflineBanner(response) {
  const html = await response.clone().text();
  const banner = `
    <div style="position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#f4b400;color:#18130a;padding:10px 16px;text-align:center;font:600 14px system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.12)">
      Sin conexion. Mostrando la ultima version guardada.
    </div>
  `;
  const bodyOffset = '<div style="height:44px" aria-hidden="true"></div>';
  const htmlWithBanner = html.includes('<body')
    ? html.replace(/(<body[^>]*>)/i, `$1${banner}${bodyOffset}`)
    : `${banner}${bodyOffset}${html}`;

  return new Response(htmlWithBanner, {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-fudimenu-offline': '1',
    },
  });
}
