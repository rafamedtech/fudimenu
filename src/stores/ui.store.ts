'use client';
import { create } from 'zustand';

type Toast = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

type UIState = {
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  bottomSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  pushToast: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  bottomSheetOpen: false,
  openSheet: () => set({ bottomSheetOpen: true }),
  closeSheet: () => set({ bottomSheetOpen: false }),
}));
