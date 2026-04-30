import { Check, Store } from 'lucide-react';
import { switchActiveTenantFormAction } from '@/server/actions/auth.actions';
import type { AuthContext } from '@/server/guards/require-auth';

type TenantMembership = AuthContext['memberships'][number];

interface TenantSwitcherProps {
  activeTenantId: string;
  memberships: TenantMembership[];
}

export function TenantSwitcher({ activeTenantId, memberships }: TenantSwitcherProps) {
  if (memberships.length < 2) return null;

  return (
    <form action={switchActiveTenantFormAction} className="flex items-center gap-1">
      <label className="sr-only" htmlFor="tenant-switcher">
        Restaurante activo
      </label>
      <div className="relative">
        <Store
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <select
          id="tenant-switcher"
          name="tenantId"
          defaultValue={activeTenantId}
          className="h-9 max-w-[8.5rem] appearance-none rounded-md border border-ink-100 bg-white py-1 pl-7 pr-2 text-xs font-semibold text-ink-800 shadow-sm outline-none focus:border-mostaza-500 focus:ring-2 focus:ring-mostaza-100"
        >
          {memberships.map(({ tenantId, tenant }) => (
            <option key={tenantId} value={tenantId}>
              {tenant.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        aria-label="Cambiar restaurante"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink-900 text-white shadow-sm hover:bg-ink-700 focus:outline-none focus:ring-2 focus:ring-mostaza-200"
      >
        <Check size={16} />
      </button>
    </form>
  );
}
