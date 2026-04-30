import { Suspense } from 'react';
import { TenantSwitcher } from '@/components/admin/tenant-switcher';
import { AppHeader } from '@/components/layout/app-header';
import { Fab } from '@/components/layout/fab';
import { ItemCard } from '@/components/menu/item-card';
import { ItemCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';
import Link from 'next/link';

export default async function MenuPage() {
  const ctx = await requireAuth();

  return (
    <>
      <AppHeader
        title="Menú"
        right={<TenantSwitcher activeTenantId={ctx.tenantId} memberships={ctx.memberships} />}
      />
      <main className="flex-1 px-4">
        <Suspense fallback={<MenuListLoading />}>
          <MenuList tenantId={ctx.tenantId} />
        </Suspense>
      </main>
      <Fab href="/menu/new" label="Agregar platillo" />
    </>
  );
}

async function MenuList({ tenantId }: { tenantId: string }) {
  const items = await menuService.getItemsByTenantId(tenantId);

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🍽️"
        title="Tu menú está vacío"
        description="Agrega tu primer platillo, ese que más venden."
        action={
          <Link href="/menu/new">
            <Button size="lg">+ Agregar platillo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} href={`/menu/${item.id}`} />
        </li>
      ))}
    </ul>
  );
}

function MenuListLoading() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i}>
          <ItemCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
