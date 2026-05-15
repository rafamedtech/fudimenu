'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { signOutAction } from '@/server/actions/auth.actions';
import { track } from '@/lib/analytics/events';

type AccountClientProps = {
  email: string;
  tenantName: string;
  tenantSlug: string;
  plan: string;
};

export function AccountClient({ email, tenantName, tenantSlug, plan }: AccountClientProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [requestingDeleteCode, setRequestingDeleteCode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();

  async function exportData() {
    setExporting(true);
    try {
      const response = await fetch('/api/account/export', { method: 'GET' });
      if (!response.ok) {
        toast.error(response.status === 429 ? 'Exportación limitada por ahora' : 'No pude exportar tus datos');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fudimenu-export-${tenantSlug}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      track('data_exported', {});
      toast.success('Exportación lista');
    } catch {
      toast.error('No pude exportar tus datos');
    } finally {
      setExporting(false);
    }
  }

  async function requestDeleteCode() {
    setRequestingDeleteCode(true);
    try {
      const response = await fetch('/api/account/delete/request', { method: 'POST' });
      if (!response.ok) {
        toast.error(response.status === 429 ? 'Intenta de nuevo más tarde' : 'No pude mandar el código');
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { email?: { sent?: boolean }; devCode?: string }
        | null;

      if (data?.devCode) {
        setDeleteCode(data.devCode);
        toast.success(`Modo dev: código ${data.devCode} (revisa consola server)`);
      } else if (data?.email?.sent === false) {
        toast.error('No se pudo enviar el email. Revisa logs del server.');
      } else {
        toast.success('Código enviado a tu email');
      }
    } catch {
      toast.error('No pude mandar el código');
    } finally {
      setRequestingDeleteCode(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'x-delete-token': deleteCode },
      });
      if (!response.ok) {
        const message = response.status === 400 ? 'Código inválido o vencido' : 'No pude eliminar la cuenta';
        toast.error(message);
        return;
      }

      track('account_deleted', {});
      toast.success('Cuenta eliminada');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('No pude eliminar la cuenta');
    } finally {
      setDeleting(false);
    }
  }

  function signOut() {
    startSignOut(async () => {
      const result = await signOutAction();
      result.clearLocalStorageKeys.forEach((key) => localStorage.removeItem(key));
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <>
      <main className="flex flex-col gap-4 px-4">
        <Card className="space-y-3 border-[1.5px] border-mostaza-500 bg-mostaza-50 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-500">Correo</p>
            <p className="mt-1 break-all text-base font-bold text-ink-900">{email}</p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-500">Restaurante activo</p>
              <p className="mt-1 font-bold text-ink-900">{tenantName}</p>
            </div>
            <span className="rounded-full bg-menta-100 px-3 py-1 text-xs font-extrabold uppercase text-menta-700">
              {plan}
            </span>
          </div>
        </Card>

        <Card className="space-y-3">
          <Button type="button" variant="outline" className="w-full justify-start" loading={exporting} onClick={exportData}>
            <Download size={18} />
            Exportar mis datos
          </Button>
          <Button type="button" variant="outline" className="w-full justify-start border-red-200 text-red-600" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={18} />
            Eliminar cuenta
          </Button>
        </Card>

        <Button type="button" variant="destructive" className="mt-2 w-full" loading={isSigningOut} onClick={signOut}>
          <LogOut size={18} />
          Cerrar sesión
        </Button>

        <p className="pb-4 text-center text-xs font-semibold text-ink-400">
          Versión 0.1.0 — hecho en MX
        </p>
      </main>

      <Sheet open={deleteOpen} onOpenChange={setDeleteOpen} title="Eliminar cuenta">
        <div className="space-y-4">
          <p className="text-sm font-semibold leading-6 text-ink-700">
            Esto desactivará el restaurante, sus platillos y el acceso del equipo. Te mandaremos
            un código de 6 dígitos a {email}.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            loading={requestingDeleteCode}
            onClick={requestDeleteCode}
          >
            Mandar código
          </Button>
          <Input
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]*"
            label="Código"
            value={deleteCode}
            onChange={(event) => setDeleteCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
          />
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            label="Confirmación"
            placeholder="ELIMINAR"
          />
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            disabled={confirmText !== 'ELIMINAR' || deleteCode.length !== 6}
            loading={deleting}
            onClick={deleteAccount}
          >
            Eliminar permanentemente
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </>
  );
}
