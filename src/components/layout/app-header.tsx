'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function AppHeader({ title, showBack, right }: AppHeaderProps) {
  const router = useRouter();
  return (
    <>
      <span className="block h-px" aria-hidden="true" />
      <header className="sticky top-0 z-20 -mt-px flex h-14 items-center justify-between bg-[var(--brand-surface-translucent)] px-4 pt-safe backdrop-blur ipad:h-16 ipad:px-6 ipad-landscape:h-[76px] ipad-landscape:px-7 desktop:px-8">
        <div className="flex w-12 items-center gap-2 ipad:w-24 ipad-landscape:w-auto">
          {showBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Volver"
              className="size-12 text-ink-700"
            >
              <ChevronLeft size={24} />
            </Button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-lg font-extrabold text-ink-900 ipad:text-xl ipad-landscape:text-left ipad-landscape:text-2xl desktop:text-3xl">{title}</h1>
        <div className="flex min-w-12 items-center justify-end ipad:min-w-24">{right}</div>
      </header>
    </>
  );
}
