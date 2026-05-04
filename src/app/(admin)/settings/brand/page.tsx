import { CheckCircle2, Clock3, MessageCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getPrisma } from '@/lib/db/prisma';
import { updateBrandSettingsFormAction } from '@/server/actions/tenant.actions';
import { requireAuth } from '@/server/guards/require-auth';

type BrandSettingsPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function BrandSettingsPage({ searchParams }: BrandSettingsPageProps) {
  const [{ saved }, ctx] = await Promise.all([searchParams, requireAuth()]);
  const tenant = await getPrisma().tenant.findUnique({
    where: { id: ctx.tenantId },
    select: {
      whatsappPhone: true,
      businessHours: true,
    },
  });

  return (
    <>
      <AppHeader title="Marca y contacto" showBack />
      <main className="flex flex-col gap-4 px-4">
        {saved === '1' && (
          <Card className="flex items-center gap-3 border border-menta-500/40 bg-menta-100 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-ink-700" />
            <span className="text-sm font-semibold text-ink-800">Ajustes actualizados</span>
          </Card>
        )}

        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-1 h-6 w-6 shrink-0 text-mostaza-600" />
            <div>
              <h2 className="text-lg font-extrabold text-ink-900">WhatsApp Business</h2>
              <p className="mt-1 text-sm leading-6 text-ink-600">
                El numero se usa para activar pedidos desde el menu publico.
              </p>
            </div>
          </div>

          <form action={updateBrandSettingsFormAction} className="space-y-4">
            <Input
              name="whatsappPhone"
              type="tel"
              label="Numero WhatsApp Business"
              placeholder="+526641234567"
              defaultValue={tenant?.whatsappPhone ?? ''}
              pattern="^\+52[0-9]{10}$"
              title="Usa el formato +52XXXXXXXXXX"
              hint="Usa +52 seguido de 10 digitos. Dejalo vacio para ocultar el boton."
            />
            <Input
              name="businessHours"
              label="Horario"
              placeholder="Lun-Vie 8am-10pm"
              defaultValue={tenant?.businessHours ?? ''}
              maxLength={120}
              prefix={<Clock3 className="h-4 w-4" />}
              hint="Texto libre para mostrar el horario operativo."
            />
            <Button type="submit" className="w-full">
              Guardar ajustes
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
