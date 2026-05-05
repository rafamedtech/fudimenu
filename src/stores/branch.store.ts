'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORE_VERSION = 1;

type BranchRef = {
  id: string;
  tenantId: string;
};

type BranchState = {
  activeBranchId: string | null;
  activeBranchTenantId: string | null;
  setBranch: (id: string | null, tenantId?: string | null) => void;
  validateHydratedBranch: (activeTenantId: string, branches?: BranchRef[]) => void;
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set, get) => ({
      activeBranchId: null,
      activeBranchTenantId: null,
      setBranch: (id, tenantId = null) =>
        set({
          activeBranchId: id,
          activeBranchTenantId: id ? tenantId : null,
        }),
      validateHydratedBranch: (activeTenantId, branches) => {
        const { activeBranchId, activeBranchTenantId } = get();
        if (!activeBranchId) return;

        const matchesStoredTenant = activeBranchTenantId === activeTenantId;
        const matchesKnownBranch =
          branches?.some(
            (branch) => branch.id === activeBranchId && branch.tenantId === activeTenantId,
          ) ?? matchesStoredTenant;

        if (!matchesStoredTenant || !matchesKnownBranch) {
          set({ activeBranchId: null, activeBranchTenantId: null });
        }
      },
    }),
    {
      name: 'fudi:branch',
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        if (version < STORE_VERSION) {
          return {
            ...(persistedState as Partial<BranchState>),
            activeBranchId: null,
            activeBranchTenantId: null,
          };
        }

        return persistedState as BranchState;
      },
    },
  ),
);
