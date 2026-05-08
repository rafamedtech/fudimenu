import { notFound } from 'next/navigation';
import Link from 'next/link';
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
  searchParams: Promise<{ sectionId?: string }>;
}

export default async function ItemEditPage({ params, searchParams }: Props) {
  const [{ id }, { sectionId }] = await Promise.all([params, searchParams]);
  const ctx = await requireAuth();
  const { tenant, categories, items } = await menuService.getMenuByTenantId(ctx.tenantId);
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
        <main className="flex-1 px-4 pt-4">
          <Card className="space-y-4 border-[1.5px] border-mostaza-500 bg-white shadow-md">
            <div>
              <p className="text-sm font-extrabold uppercase text-mostaza-600">Plan Free</p>
              <h1 className="mt-1 text-xl font-extrabold text-ink-900">
                Llegaste a {freeItemLimit} platillos
              </h1>
              <p className="mt-2 text-sm leading-6 text-ink-700">
                Pro desbloquea items ilimitados, sucursales ilimitadas, analytics básico y
                oculta la marca FudiMenu.
              </p>
            </div>
            <Link href="/settings/billing" className="block">
              <Button type="button" className="w-full">
                Upgrade
              </Button>
            </Link>
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
      <main className="flex-1 px-4 pb-24">
        <ItemEditorForm
          initial={item ?? null}
          categories={filteredCategories}
          sectionId={sectionId ?? null}
        />
      </main>
    </>
  );
}
