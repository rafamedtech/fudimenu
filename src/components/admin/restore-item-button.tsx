'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { restoreItemAction } from '@/server/actions/items.actions';

export function RestoreItemButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function handleRestore() {
    setError(false);
    startTransition(async () => {
      const result = await restoreItemAction(itemId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(true);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={isPending}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border-[1.5px] border-[var(--brand-primary-border)] bg-[var(--brand-card)] px-3 text-xs font-extrabold text-ink-900 shadow-sm transition-all hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-faint)] disabled:opacity-50"
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {error ? 'Reintentar' : isPending ? 'Restaurando…' : 'Restaurar'}
    </button>
  );
}
