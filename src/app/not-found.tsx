import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🤔</div>
      <h1 className="text-2xl font-bold">{t('errors.notFound')}</h1>
      <p className="text-ink-500">{t('errors.notFoundDesc')}</p>
      <Link href="/">
        <Button>{t('common.backHome')}</Button>
      </Link>
    </main>
  );
}
