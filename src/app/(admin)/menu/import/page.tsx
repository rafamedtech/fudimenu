import { AppHeader } from '@/components/layout/app-header';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { MenuImporter } from '@/components/admin/menu-importer';
import { PLAN_CONFIG } from '@/config/plans';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

export default async function ImportMenuPage() {
  const ctx = await requireAuth();
  const { items, sections } = await menuService.getCachedMenuByTenantId(ctx.tenantId);
  const limits = PLAN_CONFIG[ctx.plan].limits;

  return (
    <>
      <AppHeader
        title="Importar menú"
        showBack
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4 pb-24 ipad:px-6">
        <MenuImporter
          existingItemNames={items.map((item) => item.name)}
          existingSectionNames={sections.map((section) => section.name)}
          itemLimit={limits.items}
          sectionLimit={limits.sections}
          currentItemCount={items.length}
        />
      </main>
    </>
  );
}
