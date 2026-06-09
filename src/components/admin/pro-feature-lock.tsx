'use client';

import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ProFeatureLockProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  label?: string;
};

export function ProFeatureLock({
  title,
  description,
  children,
  className,
  label = '✨ Pro',
}: ProFeatureLockProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn('group h-auto min-h-0 justify-start p-0 text-left shadow-none hover:bg-transparent', className)}
        aria-label={`${title}. Requiere Pro`}
      >
        {children ?? (
          <Badge variant="dark" className="gap-1 px-2.5 py-1">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {label.replace('✨ ', '')}
          </Badge>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen} title="Desbloquea Pro">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
              <Lock className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p>
            </div>
          </div>

          <div className="rounded-md bg-[var(--brand-surface-strong)] p-4 text-sm leading-6 text-ink-700">
            Pro incluye analytics básico, items ilimitados, sucursales ilimitadas, especiales y
            quitar la marca FudiMenu.
          </div>

          <Button asChild size="lg" className="w-full text-base">
            <Link href="/settings/billing">Upgrade</Link>
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function ProBadge() {
  return (
    <Badge variant="dark" className="gap-1 px-2 py-0.5 text-[11px]">
      <Sparkles className="size-3" aria-hidden="true" />
      Pro
    </Badge>
  );
}
