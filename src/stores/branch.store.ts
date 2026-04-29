'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type BranchState = {
  activeBranchId: string | null;
  setBranch: (id: string | null) => void;
};

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      activeBranchId: null,
      setBranch: (id) => set({ activeBranchId: id }),
    }),
    { name: 'fudi:branch' },
  ),
);
