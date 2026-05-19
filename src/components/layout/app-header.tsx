'use client';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      <header className="sticky top-0 z-20 -mt-px flex h-14 items-center justify-between bg-[var(--brand-surface-translucent)] px-2 backdrop-blur ipad:h-16 ipad:px-5 ipad-landscape:px-7 desktop:px-8">
        <div className="flex w-12 items-center ipad:w-24">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="flex h-12 w-12 items-center justify-center rounded-md text-ink-700 hover:bg-[var(--brand-primary-faint)]"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-lg font-bold text-ink-900 ipad:text-xl">{title}</h1>
        <div className="flex min-w-12 items-center justify-end ipad:min-w-24">{right}</div>
      </header>
    </>
  );
}
