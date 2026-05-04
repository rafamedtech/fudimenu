import { CheckCircle2, MessageCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getPrisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/guards/require-auth';
import { updateWhatsAppSettingsFormAction } from '@/server/actions/tenant.actions';

type ContactSettingsPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function ContactSettingsPage({ searchParams }: ContactSettingsPageProps) {
  const [{ saved }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const tenant = await getPrisma().tenant.findUnique({
    where: { id: ctx.tenantId },
    select: { whatsappPhone: true },
  });

  return (
    <>
      <AppHeader title="Pedidos por WhatsApp" showBack />
      <main className="flex flex-col gap-4 px-4">
        {saved === '1' && (
          <Card className="flex items-center gap-3 border border-menta-500/40 bg-menta-100 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-ink-700" />
            <span className="text-sm font-semibold text-ink-800">WhatsApp actualizado</span>
          </Card>
        )}

        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-1 h-6 w-6 shrink-0 text-mostaza-600" />
            <div>
              <h2 className="text-lg font-extrabold text-ink-900">Número para recibir pedidos</h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                Se usará para mostrar el botón de WhatsApp en cada platillo disponible del menú
                público.
              </p>
            </div>
          </div>

          <form action={updateWhatsAppSettingsFormAction} className="space-y-4">
            <Input
              name="whatsappPhone"
              type="tel"
              label="WhatsApp"
              placeholder="+526641234567"
              defaultValue={tenant?.whatsappPhone ?? ''}
              pattern="^\+52[0-9]{10}$"
              title="Usa el formato +52XXXXXXXXXX"
              hint="Usa +52 seguido de 10 dígitos. Déjalo vacío para ocultar el botón."
            />
            <Button type="submit" className="w-full">
              Guardar WhatsApp
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
