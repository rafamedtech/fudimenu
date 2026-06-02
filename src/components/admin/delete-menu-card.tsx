'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { deleteTenantAction } from '@/server/actions/tenant.actions';

interface DeleteMenuCardProps {
  tenantId: string;
  tenantName: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  forbidden: 'Solo el dueño puede eliminar este menú.',
  last_menu: 'Es tu único menú activo. No puede eliminarse.',
  plan_limit: 'Tu plan no permite eliminar menús.',
  not_found: 'Menú no encontrado.',
  mock_unsupported: 'No disponible en modo demo.',
};

export function DeleteMenuCard({ tenantId, tenantName }: DeleteMenuCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTenantAction(tenantId);
      if (!result.ok) {
        toast.error(ERROR_MESSAGES[result.code] ?? 'No se pudo eliminar.');
        return;
      }
      toast.success('Menú eliminado.');
      router.replace('/menu');
      router.refresh();
    });
  }

  return (
    <Card className="border-[1.5px] border-coral-500 bg-coral-100/30 shadow-sm">
      <div className="flex items-start gap-3">
        <Trash2 className="mt-0.5 size-6 text-coral-500" aria-hidden />
        <div className="flex-1">
          <h3 className="font-bold text-ink-900">Eliminar este menú</h3>
          <p className="mt-1 text-sm text-ink-700">
            Borra <strong>{tenantName}</strong> y todo su contenido (secciones, categorías,
            platillos). No se puede deshacer.
          </p>

          {!confirming ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-3"
              onClick={() => setConfirming(true)}
            >
              Eliminar menú
            </Button>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <label htmlFor="delete-menu-confirmation" className="text-xs font-semibold text-ink-700">
                Escribe <code className="rounded bg-ink-100 px-1">{tenantName}</code> para confirmar
              </label>
              <input
                type="text"
                id="delete-menu-confirmation"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-md border border-ink-300 bg-[var(--brand-card)] px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText('');
                  }}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={confirmText !== tenantName || isPending}
                  loading={isPending}
                  onClick={handleDelete}
                >
                  Confirmar eliminación
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
