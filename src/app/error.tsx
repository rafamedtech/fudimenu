'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl" aria-hidden>
        😵
      </div>
      <h1 className="text-2xl font-bold">{t('errors.kitchenBurned')}</h1>
      <p className="text-ink-500">{error.message ?? t('errors.unexpected')}</p>
      <Button onClick={reset}>{t('common.retry')}</Button>
    </main>
  );
}
