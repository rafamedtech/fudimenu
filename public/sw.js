const CACHE_VERSION = 'v2';
const STATIC_CACHE = `fudimenu-static-${CACHE_VERSION}`;
const ADMIN_CACHE = `fudimenu-admin-${CACHE_VERSION}`;
const OFFLINE_QUEUE_DB = 'fudimenu-admin-offline';
const OFFLINE_QUEUE_VERSION = 1;
const OFFLINE_QUEUE_STORE = 'mutations';
const OFFLINE_QUEUE_SYNC_TAG = 'fudimenu-offline-mutations';

const ADMIN_SHELL_URLS = ['/dashboard', '/menu', '/analytics', '/settings'];
const STATIC_PATH_PREFIXES = ['/icon', '/manifest.webmanifest'];
const IS_LOCAL_DEV =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(self.skipWaiting());
    return;
  }

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
            .filter(
              (key) =>
                key.startsWith('fudimenu-') &&
                (IS_LOCAL_DEV || ![STATIC_CACHE, ADMIN_CACHE].includes(key)),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (IS_LOCAL_DEV) return;

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

self.addEventListener('sync', (event) => {
  if (event.tag !== OFFLINE_QUEUE_SYNC_TAG) return;

  event.waitUntil(replayOfflineQueue());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'fudimenu:replay-offline-queue') {
    event.waitUntil(replayOfflineQueue());
    return;
  }

  if (event.data?.type === 'fudimenu:resolve-offline-conflict') {
    event.waitUntil(resolveOfflineConflict(event.data.mutationId, event.data.resolution));
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

async function replayOfflineQueue() {
  const db = await openOfflineQueueDb();
  const mutations = await getPendingOfflineMutations(db);
  let replayed = 0;

  try {
    for (const mutation of mutations) {
      if (!mutation.id) continue;

      await updateOfflineMutation(db, mutation.id, {
        status: 'processing',
        updatedAt: Date.now(),
      });

      try {
        await sendOfflineMutation(mutation);
        await deleteOfflineMutation(db, mutation.id);
        replayed += 1;
      } catch (error) {
        await markOfflineMutationFailed(db, mutation, error);
        if (isOfflineMutationConflict(error)) {
          await notifyOfflineQueueClients({
            type: 'fudimenu:offline-queue-conflict',
            mutation: toOfflineConflictPayload(mutation, error),
          });
          return;
        }

        await notifyOfflineQueueClients({
          type: 'fudimenu:offline-queue-sync',
          status: 'failed',
          replayed,
          failedMutationId: mutation.id,
        });
        throw error;
      }
    }

    await notifyOfflineQueueClients({
      type: 'fudimenu:offline-queue-sync',
      status: 'synced',
      replayed,
    });
  } finally {
    db.close();
  }
}

async function resolveOfflineConflict(mutationId, resolution) {
  if (!mutationId || resolution !== 'keep-local') return;

  const db = await openOfflineQueueDb();

  try {
    const mutation = await getOfflineMutation(db, mutationId);
    if (!mutation) return;

    await sendOfflineMutation(mutation, {
      'x-fudimenu-conflict-resolution': 'keep-local',
    });
    await deleteOfflineMutation(db, mutationId);
    await notifyOfflineQueueClients({
      type: 'fudimenu:offline-queue-conflict-resolved',
      mutationId,
    });
  } catch (error) {
    await notifyOfflineQueueClients({
      type: 'fudimenu:offline-queue-conflict-resolution-failed',
      mutationId,
      error: formatOfflineQueueError(error),
    });
  } finally {
    db.close();
  }
}

function openOfflineQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB, OFFLINE_QUEUE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) return;

      const store = db.createObjectStore(OFFLINE_QUEUE_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      });

      store.createIndex('clientMutationId', 'clientMutationId');
      store.createIndex('status', 'status');
      store.createIndex('type', 'type');
      store.createIndex('createdAt', 'createdAt');
      store.createIndex('updatedAt', 'updatedAt');
      store.createIndex('[status+createdAt]', ['status', 'createdAt']);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Offline queue database upgrade was blocked.'));
  });
}

function getPendingOfflineMutations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE);
    const index = store.index('[status+createdAt]');
    const range = IDBKeyRange.bound(['pending', 0], ['pending', Number.MAX_SAFE_INTEGER]);
    const request = index.getAll(range);

    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
}

function getOfflineMutation(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
    const request = transaction.objectStore(OFFLINE_QUEUE_STORE).get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateOfflineMutation(db, id, patch) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_STORE);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const mutation = getRequest.result;
      if (!mutation) {
        resolve();
        return;
      }

      store.put({ ...mutation, ...patch });
    };
    getRequest.onerror = () => reject(getRequest.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function deleteOfflineMutation(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
    transaction.objectStore(OFFLINE_QUEUE_STORE).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function markOfflineMutationFailed(db, mutation, error) {
  const attempts = (mutation.attempts ?? 0) + 1;
  const maxAttempts = mutation.maxAttempts ?? 5;

  await updateOfflineMutation(db, mutation.id, {
    attempts,
    lastError: formatOfflineQueueError(error),
    status: attempts >= maxAttempts ? 'failed' : 'pending',
    updatedAt: Date.now(),
  });
}

async function sendOfflineMutation(mutation, extraHeaders) {
  const headers = new Headers({ ...(mutation.headers ?? {}), ...(extraHeaders ?? {}) });

  if (mutation.payload !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  if (!headers.has('x-fudimenu-client-mutation-id')) {
    headers.set('x-fudimenu-client-mutation-id', mutation.clientMutationId);
  }

  const response = await fetch(normalizeOfflineMutationUrl(mutation.url), {
    method: mutation.method ?? 'POST',
    headers,
    credentials: 'same-origin',
    body: mutation.payload === undefined ? undefined : JSON.stringify(mutation.payload),
  });

  if (!response.ok) {
    const error = new Error(`Offline mutation failed with ${response.status}`);
    error.status = response.status;
    error.body = await response.json().catch(() => null);
    throw error;
  }
}

function normalizeOfflineMutationUrl(url) {
  const normalized = new URL(url, self.location.origin);
  if (normalized.origin !== self.location.origin) {
    throw new Error('Offline queue only replays same-origin mutations.');
  }

  return normalized.href;
}

function formatOfflineQueueError(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown offline queue error';
}

function isOfflineMutationConflict(error) {
  return error?.status === 409 || error?.status === 412;
}

function toOfflineConflictPayload(mutation, error) {
  return {
    id: mutation.id,
    clientMutationId: mutation.clientMutationId,
    type: mutation.type,
    url: mutation.url,
    method: mutation.method,
    payload: mutation.payload,
    server: error.body?.item ?? error.body?.current ?? error.body ?? null,
  };
}

async function notifyOfflineQueueClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  await Promise.all(clients.map((client) => client.postMessage(message)));
}
