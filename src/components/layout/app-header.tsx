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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-crema-50/80 px-2 backdrop-blur">
      <div className="flex w-12 items-center">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="flex h-12 w-12 items-center justify-center rounded-md text-ink-700 hover:bg-ink-100"
          >
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      <h1 className="flex-1 truncate text-center text-lg font-bold text-ink-900">{title}</h1>
      <div className="flex w-12 items-center justify-end">{right}</div>
    </header>
  );
}
