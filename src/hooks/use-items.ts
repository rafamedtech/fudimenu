'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MenuItem } from '@/types/domain';
import { apiFetch } from '@/lib/api/client';
import { upsertItemAction, toggleItemAvailabilityAction } from '@/server/actions/items.actions';
import type { ItemInput } from '@/lib/validators/item.schema';

const ITEMS_KEY = ['items'] as const;

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: () => apiFetch<MenuItem[]>('/api/items'),
    staleTime: 30_000,
  });
}

export function useUpsertItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ItemInput) => upsertItemAction(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      toggleItemAvailabilityAction(id, available),
    onMutate: async ({ id, available }) => {
      await qc.cancelQueries({ queryKey: ITEMS_KEY });
      const previous = qc.getQueryData<MenuItem[]>(ITEMS_KEY);
      qc.setQueryData<MenuItem[]>(ITEMS_KEY, (old) =>
        old?.map((i) => (i.id === id ? { ...i, isAvailable: available } : i)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ITEMS_KEY, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}
