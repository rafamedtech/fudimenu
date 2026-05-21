import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { CategoryEditorForm } from '@/components/admin/category-editor-form';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sectionId?: string }>;
}

export default async function EditCategoryPage({ params, searchParams }: Props) {
  const [{ id }, { sectionId }, ctx] = await Promise.all([params, searchParams, requireAuth()]);
  const { categories } = await menuService.getCachedMenuByTenantId(ctx.tenantId);
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();

  return (
    <>
      <AppHeader
        title="Editar categoría"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24">
        <CategoryEditorForm initial={category} sectionId={sectionId ?? category.sectionId} />
      </main>
    </>
  );
}
