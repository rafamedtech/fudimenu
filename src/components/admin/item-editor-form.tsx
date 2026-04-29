'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { itemSchema, type ItemInput } from '@/lib/validators/item.schema';
import { upsertItemAction } from '@/server/actions/items.actions';
import { toUserMessage } from '@/lib/api/errors';
import { track } from '@/lib/analytics/events';
import type { MenuItem } from '@/types/domain';

interface Props {
  initial: MenuItem | null;
}

export function ItemEditorForm({ initial }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      id: initial?.id,
      categoryId: initial?.categoryId ?? null,
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      priceCents: initial?.priceCents ?? 0,
      currency: initial?.currency ?? 'MXN',
      imageUrl: initial?.imageUrl ?? null,
      isAvailable: initial?.isAvailable ?? true,
    },
  });

  const isAvailable = watch('isAvailable');
  const priceCents = watch('priceCents');

  async function onSubmit(data: ItemInput) {
    try {
      const res = await upsertItemAction(data);
      if (res.ok) {
        toast.success('✓ Guardado');
        track(initial ? 'item_edited' : 'item_created', {
          itemId: res.item.id,
          field: 'all',
        } as never);
        router.push('/menu');
      }
    } catch (err) {
      toast.error(toUserMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
      <button
        type="button"
        className="flex h-44 w-full items-center justify-center rounded-lg bg-crema-100 text-ink-500"
        onClick={() => toast.info('Upload conectado a Cloudinary próximamente')}
      >
        📸 Sube una foto rica
      </button>

      <Input
        label="Nombre"
        placeholder="Ej: Tacos al pastor"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Precio"
        type="number"
        prefix="$"
        inputMode="numeric"
        placeholder="0"
        error={errors.priceCents?.message}
        value={(priceCents ?? 0) / 100}
        onChange={(e) => setValue('priceCents', Math.round(Number(e.target.value) * 100))}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</label>
        <textarea
          {...register('description')}
          rows={4}
          placeholder="¿Qué lleva? ¿Por qué les va a encantar?"
          className="w-full rounded-md border-[1.5px] border-ink-300 bg-white p-4 text-base text-ink-900 outline-none placeholder:text-ink-500 focus-within:border-mostaza-500 focus-within:shadow-glow-mostaza"
        />
      </div>

      <div className="flex items-center justify-between rounded-md bg-white p-4 shadow-sm">
        <div>
          <p className="font-semibold">Disponible</p>
          <p className="text-xs text-ink-500">Apaga si se acabó</p>
        </div>
        <Toggle
          checked={!!isAvailable}
          onChange={(v) => setValue('isAvailable', v)}
          ariaLabel="Disponible"
        />
      </div>

      <div className="sticky bottom-[88px] mt-4 flex gap-3">
        <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
