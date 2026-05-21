import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { CategoryEditorForm } from '@/components/admin/category-editor-form';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

type NewCategoryPageProps = {
  searchParams: Promise<{ sectionId?: string }>;
};

export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const [{ sectionId }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const { categories } = await menuService.getCachedMenuByTenantId(ctx.tenantId);
  const scopedCategories = categories.filter((category) => category.sectionId === (sectionId ?? null));

  return (
    <>
      <AppHeader
        title="Nueva categoría"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24">
        <CategoryEditorForm sectionId={sectionId ?? null} nextSortOrder={scopedCategories.length} />
      </main>
    </>
  );
}
