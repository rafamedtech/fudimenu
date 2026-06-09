'use client';

import { Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { canCreateAnotherMenu } from '@/config/plans';
import { Select } from '@/components/ui/select';
import { switchActiveTenantAction } from '@/server/actions/auth.actions';
import type { AuthContext } from '@/server/guards/require-auth';

interface TenantSwitcherProps {
  activeTenantId: string;
  memberships: AuthContext['memberships'];
}

const ADD_MENU_VALUE = '__new__';

export function TenantSwitcher({ activeTenantId, memberships }: TenantSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canAddMenu = canCreateAnotherMenu(memberships);

  if (memberships.length < 2 && !canAddMenu) return null;

  function switchTenant(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === activeTenantId) return;

    if (value === ADD_MENU_VALUE) {
      router.push('/onboarding?new=1');
      return;
    }

    startTransition(async () => {
      await switchActiveTenantAction(value);
    });
  }

  return (
    <div className="relative">
      <Store
        aria-hidden="true"
        size={14}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-500"
      />
      <Select
        value={activeTenantId}
        onChange={switchTenant}
        disabled={isPending}
        className="h-9 max-w-[8.5rem] pl-7 pr-8 text-xs"
        aria-label="Menú activo"
      >
        {memberships.map(({ tenantId, tenant }) => (
          <option key={tenantId} value={tenantId}>
            {tenant.name}
          </option>
        ))}
        {canAddMenu && <option value={ADD_MENU_VALUE}>+ Nuevo menú</option>}
      </Select>
    </div>
  );
}
