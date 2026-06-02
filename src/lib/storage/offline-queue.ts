import Dexie, { type Table } from 'dexie';

type OfflineMutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type OfflineMutationStatus = 'pending' | 'processing' | 'failed';

type OfflineMutationInput<TPayload extends JsonValue = JsonValue> = {
  type: string;
  url: string;
  method?: OfflineMutationMethod;
  payload?: TPayload;
  headers?: Record<string, string>;
  maxAttempts?: number;
};

type OfflineMutation<TPayload extends JsonValue = JsonValue> =
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
const OFFLINE_QUEUE_RESOLVE_CONFLICT_MESSAGE = 'fudimenu:resolve-offline-conflict';

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

function isOfflineQueueSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function getOfflineQueueDb(): OfflineQueueDatabase {
  if (!isOfflineQueueSupported()) {
    throw new Error('Offline queue is only available in browsers with IndexedDB support.');
  }

  db ??= new OfflineQueueDatabase();
  return db;
}

export async function getQueuedOfflineMutation(
  id: number,
): Promise<OfflineMutation | undefined> {
  return getOfflineQueueDb().mutations.get(id);
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
