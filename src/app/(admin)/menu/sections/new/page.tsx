import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { SectionEditorForm } from '@/components/admin/section-editor-form';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

export default async function NewSectionPage() {
  const ctx = await requireAuth();
  const { sections } = await menuService.getCachedMenuByTenantId(ctx.tenantId);

  return (
    <>
      <AppHeader
        title="Nueva sección"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pb-24 ipad:px-6 ipad-landscape:px-7 desktop:px-8">
        <SectionEditorForm nextSortOrder={sections.length} />
      </main>
    </>
  );
}
