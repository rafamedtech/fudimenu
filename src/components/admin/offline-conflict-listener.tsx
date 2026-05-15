'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { keepLocalOfflineMutation, type JsonValue } from '@/lib/storage/offline-queue';

type OfflineConflictMutation = {
  id?: number;
  type?: string;
  url?: string;
  payload?: JsonValue;
};

type OfflineQueueMessage =
  | {
      type: 'fudimenu:offline-queue-conflict';
      mutation?: OfflineConflictMutation;
    }
  | {
      type: 'fudimenu:offline-queue-conflict-resolved';
      mutationId?: number;
    }
  | {
      type: 'fudimenu:offline-queue-conflict-resolution-failed';
      mutationId?: number;
      error?: string;
    };

export function OfflineConflictListener() {
  const router = useRouter();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    function handleMessage(event: MessageEvent<OfflineQueueMessage>) {
      const message = event.data;

      if (message?.type === 'fudimenu:offline-queue-conflict') {
        const mutation = message.mutation;
        if (!mutation?.id) return;
        const mutationId = mutation.id;

        toast.custom(
          (toastId) => (
            <div className="w-[min(calc(100vw-32px),420px)] rounded-md border border-ink-200 bg-[var(--brand-card)] p-4 text-ink-900 shadow-xl">
              <p className="text-sm font-bold">Otro usuario editó esto. ¿Mantener tus cambios?</p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    toast.dismiss(toastId);
                    void keepLocalOfflineMutation(mutationId);
                  }}
                >
                  Mis cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    toast.dismiss(toastId);
                    router.push(getConflictReviewHref(mutation));
                  }}
                >
                  Ver ambos
                </Button>
              </div>
            </div>
          ),
          { duration: Infinity, id: `offline-conflict-${mutationId}` },
        );
        return;
      }

      if (message?.type === 'fudimenu:offline-queue-conflict-resolved') {
        toast.success('Tus cambios se guardaron');
        router.refresh();
        return;
      }

      if (message?.type === 'fudimenu:offline-queue-conflict-resolution-failed') {
        toast.error('No pude guardar tus cambios. Reintenta.');
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [router]);

  return null;
}

function getConflictReviewHref(mutation: OfflineConflictMutation): string {
  const itemId = getPayloadItemId(mutation.payload);
  const params = new URLSearchParams({ offlineConflict: String(mutation.id) });

  return itemId ? `/menu/${itemId}?${params}` : `/menu?${params}`;
}

function getPayloadItemId(payload: JsonValue | undefined): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const id = payload.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}
