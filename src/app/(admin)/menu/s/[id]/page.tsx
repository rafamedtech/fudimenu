import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { AddItemFab } from '@/components/admin/add-item-fab';
import { SectionCategoryList } from '@/components/admin/section-category-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SectionDetailPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, requireAuth()]);
  const { tenant, sections, categories, items } = await menuService.getCachedMenuByTenantId(ctx.tenantId);

  const section = sections.find((s) => s.id === id);
  if (!section) notFound();

  const sectionCategories = categories.filter((c) => c.sectionId === section.id);
  const groups = [];
  for (const category of sectionCategories) {
    const categoryItems = items.filter((item) => item.categoryId === category.id);
    if (categoryItems.length > 0) groups.push({ category, items: categoryItems });
  }

  const hasItems = groups.length > 0;

  return (
    <>
      <AppHeader
        title={section.name}
        showBack
        right={
          <div className="flex items-center gap-1">
            <Link
              href={`/menu/sections/${section.id}/edit`}
              aria-label="Editar sección"
              className="flex size-12 items-center justify-center rounded-md text-ink-700 hover:bg-ink-100"
            >
              <Settings2 className="size-5" aria-hidden />
            </Link>
            <TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />
          </div>
        }
      />
      <main className="flex-1 px-4 pb-24 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        {sectionCategories.length === 0 ? (
          <EmptyState
            emoji="🏷️"
            title="Crea una categoría primero"
            description="Las categorías ordenan los platillos dentro de esta sección."
            action={
              <Link href={`/menu/categories/new?sectionId=${section.id}`}>
                <Button size="lg">+ Crear categoría</Button>
              </Link>
            }
          />
        ) : !hasItems ? (
          <EmptyState
            emoji="🍽️"
            title="Sin platillos"
            description="Agrega el primer platillo de esta sección."
            action={
              <Link href={`/menu/new?sectionId=${section.id}`}>
                <Button size="lg">+ Agregar platillo</Button>
              </Link>
            }
          />
        ) : (
          <SectionCategoryList
            sectionId={section.id}
            groups={groups}
            defaultLocale={tenant.defaultLocale}
            timezone={tenant.timezone}
          />
        )}
        <AddItemFab sectionId={section.id} />
      </main>
    </>
  );
}
