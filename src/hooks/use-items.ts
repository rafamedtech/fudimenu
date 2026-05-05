'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MenuItem } from '@/types/domain';
import { apiFetch } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
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
    mutationFn: async (input: ItemInput) => {
      const result = await upsertItemAction(input);
      if (!result.ok) throw actionErrorToApiError(result.code);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useToggleAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const result = await toggleItemAvailabilityAction(id, available);
      if (!result.ok) throw actionErrorToApiError(result.code);
      return result;
    },
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

function actionErrorToApiError(code: 'unauthorized') {
  return new ApiError(401, code, 'Unauthorized');
}
