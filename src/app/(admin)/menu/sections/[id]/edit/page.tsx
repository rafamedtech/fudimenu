import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { SectionEditorForm } from '@/components/admin/section-editor-form';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSectionPage({ params }: Props) {
  const [{ id }, ctx] = await Promise.all([params, requireAuth()]);
  const { sections } = await menuService.getCachedMenuByTenantId(ctx.tenantId);
  const section = sections.find((item) => item.id === id);
  if (!section) notFound();

  return (
    <>
      <AppHeader
        title="Editar sección"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24">
        <SectionEditorForm initial={section} />
      </main>
    </>
  );
}
