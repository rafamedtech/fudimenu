import { Suspense } from 'react';
import { CheckCircle2, Palette } from 'lucide-react';
import { BrandSettingsForm } from '@/components/admin/brand-settings-form';
import { AppHeader } from '@/components/layout/app-header';
import { Card } from '@/components/ui/card';
import { FormSkeleton } from '@/components/ui/skeleton';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { requireAuth } from '@/server/guards/require-auth';

type BrandSettingsPageProps = {
  searchParams: Promise<{ saved?: string; slugTaken?: string }>;
};

export default async function BrandSettingsPage({ searchParams }: BrandSettingsPageProps) {
  const [{ saved, slugTaken }, ctx] = await Promise.all([searchParams, requireAuth()]);
  return (
    <>
      <AppHeader title="Marca y tema" showBack />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <div className="flex flex-col gap-6 ipad:gap-8">
          <header className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mostaza-50 text-mostaza-700">
              <Palette className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
                Tu identidad
              </p>
              <h2 className="mt-1 font-heading text-xl font-extrabold text-ink-900 ipad:text-2xl">
                Identidad del menú
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Ajusta cómo se ve y se comparte tu restaurante.
              </p>
            </div>
          </header>

          {saved === '1' && (
            <Card className="flex items-center gap-3 border border-menta-500/40 bg-menta-100 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-ink-700" />
              <span className="text-sm font-semibold text-ink-800">Ajustes actualizados</span>
            </Card>
          )}
          {slugTaken && (
            <Card className="border border-red-200 bg-red-50 text-sm font-semibold text-red-700 shadow-sm">
              Slug tomado — prueba: {slugTaken}
            </Card>
          )}

          <Suspense fallback={<FormSkeleton />}>
            <BrandSettingsContent tenantId={ctx.tenantId} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function BrandSettingsContent({ tenantId }: { tenantId: string }) {
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? mockTenant
      : await getPrisma().tenant.findUnique({
          where: { id: tenantId },
          select: {
            slug: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
          },
        });

  return (
    <BrandSettingsForm
      currentSlug={tenant?.slug ?? ''}
      tenantName={tenant?.name ?? ''}
      logoUrl={tenant?.logoUrl ?? null}
      primaryColor={tenant?.primaryColor ?? '#F4B400'}
    />
  );
}
