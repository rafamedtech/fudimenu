import Dexie, { type Table } from 'dexie';

export type OfflineMutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type OfflineMutationStatus = 'pending' | 'processing' | 'failed';

export type OfflineMutationInput<TPayload extends JsonValue = JsonValue> = {
  type: string;
  url: string;
  method?: OfflineMutationMethod;
  payload?: TPayload;
  headers?: Record<string, string>;
  maxAttempts?: number;
};

export type OfflineMutation<TPayload extends JsonValue = JsonValue> =
  OfflineMutationInput<TPayload> & {
    id?: number;
    clientMutationId: string;
    method: OfflineMutationMethod;
    status: OfflineMutationStatus;
    attempts: number;
    maxAttempts: number;
    createdAt: number;
    updatedAt: number;
    lastError?: string;
  };

const DATABASE_NAME = 'fudimenu-admin-offline';
const MUTATIONS_TABLE = 'mutations';
const DEFAULT_MAX_ATTEMPTS = 5;
const OFFLINE_QUEUE_SYNC_TAG = 'fudimenu-offline-mutations';
const OFFLINE_QUEUE_REPLAY_MESSAGE = 'fudimenu:replay-offline-queue';
const OFFLINE_QUEUE_RESOLVE_CONFLICT_MESSAGE = 'fudimenu:resolve-offline-conflict';

type ServiceWorkerRegistrationWithSync = ServiceWorkerRegistration & {
  sync?: {
    register(tag: string): Promise<void>;
  };
};

class OfflineQueueDatabase extends Dexie {
  mutations!: Table<OfflineMutation, number>;

  constructor() {
    super(DATABASE_NAME);

    this.version(1).stores({
      [MUTATIONS_TABLE]:
        '++id, clientMutationId, status, type, createdAt, updatedAt, [status+createdAt]',
    });
  }
}

let db: OfflineQueueDatabase | null = null;

export function isOfflineQueueSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

export function getOfflineQueueDb(): OfflineQueueDatabase {
  if (!isOfflineQueueSupported()) {
    throw new Error('Offline queue is only available in browsers with IndexedDB support.');
  }

  db ??= new OfflineQueueDatabase();
  return db;
}

export async function enqueueOfflineMutation<TPayload extends JsonValue = JsonValue>(
  mutation: OfflineMutationInput<TPayload>,
): Promise<OfflineMutation<TPayload>> {
  const now = Date.now();
  const queuedMutation: OfflineMutation<TPayload> = {
    ...mutation,
    clientMutationId: createClientMutationId(),
    method: mutation.method ?? 'POST',
    status: 'pending',
    attempts: 0,
    maxAttempts: mutation.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    createdAt: now,
    updatedAt: now,
  };

  const id = await getOfflineQueueDb().mutations.add(queuedMutation);
  void registerOfflineQueueSync().catch(() => undefined);

  return { ...queuedMutation, id };
}

export async function getQueuedOfflineMutations(limit = 50): Promise<OfflineMutation[]> {
  return getOfflineQueueDb()
    .mutations.where('[status+createdAt]')
    .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
    .limit(limit)
    .toArray();
}

export async function getQueuedOfflineMutation(
  id: number,
): Promise<OfflineMutation | undefined> {
  return getOfflineQueueDb().mutations.get(id);
}

export async function markOfflineMutationProcessing(id: number): Promise<void> {
  await getOfflineQueueDb().mutations.update(id, {
    status: 'processing',
    updatedAt: Date.now(),
  });
}

export async function markOfflineMutationFailed(id: number, error: unknown): Promise<void> {
  const queue = getOfflineQueueDb();

  await queue.transaction('rw', queue.mutations, async () => {
    const mutation = await queue.mutations.get(id);
    if (!mutation) return;

    await queue.mutations.update(id, {
      attempts: mutation.attempts + 1,
      lastError: formatOfflineQueueError(error),
      status: mutation.attempts + 1 >= mutation.maxAttempts ? 'failed' : 'pending',
      updatedAt: Date.now(),
    });
  });
}

export async function completeOfflineMutation(id: number): Promise<void> {
  await getOfflineQueueDb().mutations.delete(id);
}

export async function removeOfflineMutation(id: number): Promise<void> {
  await getOfflineQueueDb().mutations.delete(id);
}

export async function clearOfflineMutations(): Promise<void> {
  await getOfflineQueueDb().mutations.clear();
}

export async function countQueuedOfflineMutations(): Promise<number> {
  return getOfflineQueueDb().mutations.where('status').equals('pending').count();
}

export async function registerOfflineQueueSync(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const registration = (await navigator.serviceWorker.ready) as ServiceWorkerRegistrationWithSync;

  if (registration.sync) {
    await registration.sync.register(OFFLINE_QUEUE_SYNC_TAG);
    return;
  }

  registration.active?.postMessage({ type: OFFLINE_QUEUE_REPLAY_MESSAGE });
}

export async function keepLocalOfflineMutation(mutationId: number): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    type: OFFLINE_QUEUE_RESOLVE_CONFLICT_MESSAGE,
    mutationId,
    resolution: 'keep-local',
  });
}

function createClientMutationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function formatOfflineQueueError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown offline queue error';
}
