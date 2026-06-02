'use client';

import { X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    router.replace(pathname, { scroll: false });
  }

  return (
    <Card className="relative mb-4 border-[1.5px] border-mostaza-500 bg-mostaza-50 pr-10 shadow-sm">
      <p className="text-sm font-extrabold text-ink-900">
        Tu menú arrancó con 6 platillos base. Edita nombres, precios o fotos cuando quieras.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Cerrar"
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-ink-700 hover:bg-mostaza-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </Card>
  );
}
