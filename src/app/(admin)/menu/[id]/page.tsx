import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { ItemEditorForm } from '@/components/admin/item-editor-form';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ItemEditPage({ params }: Props) {
  const { id } = await params;
  const ctx = await requireAuth();
  const items = await menuService.getItemsByTenantId(ctx.tenantId);
  const item = items.find((i) => i.id === id);

  if (id !== 'new' && !item) notFound();

  return (
    <>
      <AppHeader
        title={id === 'new' ? 'Nuevo platillo' : 'Editar platillo'}
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24">
        <ItemEditorForm initial={item ?? null} />
      </main>
    </>
  );
}
