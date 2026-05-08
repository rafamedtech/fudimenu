import { CheckCircle2, Palette } from 'lucide-react';
import { BrandSettingsForm } from '@/components/admin/brand-settings-form';
import { AppHeader } from '@/components/layout/app-header';
import { Card } from '@/components/ui/card';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { requireAuth } from '@/server/guards/require-auth';

type BrandSettingsPageProps = {
  searchParams: Promise<{ saved?: string; slugTaken?: string }>;
};

export default async function BrandSettingsPage({ searchParams }: BrandSettingsPageProps) {
  const [{ saved, slugTaken }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? mockTenant
      : await getPrisma().tenant.findUnique({
          where: { id: ctx.tenantId },
          select: {
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        });

  return (
    <>
      <AppHeader title="Marca y tema" showBack />
      <main className="flex flex-col gap-4 px-4">
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

        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <Palette className="mt-1 h-6 w-6 shrink-0 text-mostaza-600" />
            <div>
              <h2 className="text-lg font-extrabold text-ink-900">Identidad del menu</h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Ajusta como se ve y comparte tu restaurante.
              </p>
            </div>
          </div>

          <BrandSettingsForm
            currentSlug={tenant?.slug ?? ''}
            logoUrl={tenant?.logoUrl ?? null}
            primaryColor={tenant?.primaryColor ?? '#F4B400'}
          />
        </Card>
      </main>
    </>
  );
}
