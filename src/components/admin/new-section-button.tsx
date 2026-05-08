'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertSectionAction } from '@/server/actions/sections.actions';

export function NewSectionButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await upsertSectionAction({ name: name.trim() });
      if (!result.ok) {
        toast.error('No se pudo guardar la sección');
        return;
      }
      toast.success('Sección creada');
      setOpen(false);
      setName('');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        + Nueva sección
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mostaza-300 bg-mostaza-50 p-4">
      <Input
        label="Nombre de sección"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Desayunos"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={handleSave} loading={isPending}>
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => {
            setOpen(false);
            setName('');
          }}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
