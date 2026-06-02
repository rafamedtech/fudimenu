import { Suspense } from 'react';
import { CheckCircle2, Clock3, MessageCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormSkeleton } from '@/components/ui/skeleton';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { updateContactSettingsFormAction } from '@/server/actions/contact.actions';
import { requireAuth } from '@/server/guards/require-auth';

type ContactSettingsPageProps = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function ContactSettingsPage({ searchParams }: ContactSettingsPageProps) {
  const [{ saved }, ctx] = await Promise.all([searchParams, requireAuth()]);
  return (
    <>
      <AppHeader title="Contacto del restaurante" showBack />
      <main className="flex flex-col gap-4 px-4">
        {saved === '1' && (
          <Card className="flex items-center gap-3 border border-menta-500/40 bg-menta-100 shadow-sm">
            <CheckCircle2 className="size-5 text-ink-700" />
            <span className="text-sm font-semibold text-ink-800">Contacto actualizado</span>
          </Card>
        )}

        <Suspense fallback={<FormSkeleton />}>
          <ContactSettingsContent tenantId={ctx.tenantId} />
        </Suspense>
      </main>
    </>
  );
}

async function ContactSettingsContent({ tenantId }: { tenantId: string }) {
  const tenant =
    process.env.USE_MOCKS === 'true'
      ? mockTenant
      : await getPrisma().tenant.findUnique({
          where: { id: tenantId },
          select: {
            whatsappPhone: true,
            businessHours: true,
          },
        });

  return (
    <Card className="space-y-5">
      <div className="flex items-start gap-3">
        <MessageCircle className="mt-1 size-6 shrink-0 text-menta-700" />
        <div>
          <h2 className="text-lg font-extrabold text-ink-900">WhatsApp y horarios</h2>
          <p className="mt-1 text-sm leading-6 text-ink-600">
            Datos visibles para comensales en el menu publico.
          </p>
        </div>
      </div>

      <form action={updateContactSettingsFormAction} className="space-y-4">
        <Input
          name="whatsappPhone"
          type="tel"
          label="Numero WhatsApp Business"
          placeholder="+52 664 123 4567"
          defaultValue={tenant?.whatsappPhone ?? ''}
          pattern="^\+[1-9]\d{6,14}$"
          title="Usa formato internacional E.164: +[codigo pais][numero]"
          hint="Formato internacional E.164: +[código país][número]. Ejemplos: +52 (MX), +57 (CO), +1 (US)"
        />
        <Input
          name="businessHours"
          label="Horario"
          placeholder="Lun-Vie 8am-10pm"
          defaultValue={tenant?.businessHours ?? ''}
          maxLength={120}
          prefix={<Clock3 className="size-4" />}
          hint="Texto libre para mostrar el horario operativo."
        />
        <Button type="submit" className="w-full">
          Guardar contacto
        </Button>
      </form>
    </Card>
  );
}
