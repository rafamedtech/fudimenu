'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRestore}
      disabled={isPending}
      className="h-8 shrink-0 px-3 text-xs font-extrabold"
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {error ? 'Reintentar' : isPending ? 'Restaurando…' : 'Restaurar'}
    </Button>
  );
}
