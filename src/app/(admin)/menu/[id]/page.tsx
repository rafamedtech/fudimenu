import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { ItemEditorForm } from '@/components/admin/item-editor-form';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PLAN_CONFIG } from '@/config/plans';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sectionId?: string; offlineConflict?: string }>;
}

export default async function ItemEditPage({ params, searchParams }: Props) {
  const [{ id }, { sectionId, offlineConflict }, ctx] = await Promise.all([params, searchParams, requireAuth()]);
  const { tenant, categories, items } = await menuService.getCachedMenuByTenantId(ctx.tenantId);
  const item = items.find((i) => i.id === id);
  const freeItemLimit = PLAN_CONFIG.free.limits.items ?? 20;

  if (id !== 'new' && !item) notFound();

  if (id === 'new' && tenant.plan === 'free' && items.length >= freeItemLimit) {
    return (
      <>
        <AppHeader
          title="Nuevo platillo"
          showBack
          right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
        />
        <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-4 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
          <Card className="space-y-4 border-[1.5px] border-mostaza-500 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-mostaza-100 text-ink-900">
                <Lock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase text-mostaza-600">Plan Free</p>
                <h1 className="mt-0.5 text-xl font-extrabold text-ink-900">
                  Llegaste a {freeItemLimit} platillos
                </h1>
                <p className="mt-2 text-sm leading-6 text-ink-700">
                  Pro desbloquea items ilimitados, quitar la marca FudiMenu y activar
                  analytics básico.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/menu" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Volver
                </Button>
              </Link>
              <Link href="/settings/billing" className="flex-1">
                <Button type="button" className="w-full">
                  Upgrade
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </>
    );
  }

  const filteredCategories = sectionId
    ? categories.filter((category) => category.sectionId === sectionId)
    : categories;

  return (
    <>
      <AppHeader
        title={id === 'new' ? 'Nuevo platillo' : 'Editar platillo'}
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-24 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <ItemEditorForm
          initial={item ?? null}
          categories={filteredCategories}
          sectionId={sectionId ?? null}
          offlineConflictId={Number(offlineConflict)}
          defaultLocale={tenant.defaultLocale}
        />
      </main>
    </>
  );
}
