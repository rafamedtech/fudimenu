import Image from 'next/image';
import { Gift, Link2, QrCode, Sparkles, UsersRound } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/server/guards/require-auth';
import { referralService } from '@/server/services/referral.service';

function formatMoney(cents: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ReferralSettingsPage() {
  const ctx = await requireAuth();
  const dashboard = await referralService.getDashboardForTenant({
    tenantId: ctx.tenantId,
    referrerId: ctx.userId,
  });

  const stats = [
    {
      label: 'Invitados',
      value: dashboard.stats.invited.toString(),
      icon: UsersRound,
    },
    {
      label: 'Signups',
      value: dashboard.stats.signups.toString(),
      icon: Sparkles,
    },
    {
      label: 'Creditos ganados',
      value: formatMoney(dashboard.stats.creditsEarnedCents),
      icon: Gift,
    },
  ];

  return (
    <>
      <AppHeader title="Referidos" showBack />
      <main className="flex flex-col gap-4 px-4">
        <Card className="space-y-5 border-[1.5px] border-mostaza-500/40 bg-mostaza-50 shadow-sm">
          <div className="flex items-start gap-3">
            <Gift className="mt-1 h-6 w-6 shrink-0 text-mostaza-700" />
            <div>
              <h2 className="text-xl font-extrabold text-ink-900">Comparte FudiMenu</h2>
              <p className="mt-1 text-sm leading-6 text-ink-700">
                Cada restaurante que llega desde tu link puede dejar credito a favor en tu cuenta.
              </p>
            </div>
          </div>

          <div className="rounded-md border-[1.5px] border-ink-100 bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-ink-500">
              <Link2 className="h-4 w-4" />
              Link referral
            </div>
            <p className="mt-2 break-all text-sm font-bold text-ink-900">{dashboard.url}</p>
          </div>
        </Card>

        <section className="grid grid-cols-3 gap-2" aria-label="Estadisticas de referidos">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label} className="min-h-28 p-3">
                <Icon className="h-5 w-5 text-mostaza-700" />
                <p className="mt-3 text-2xl font-extrabold text-ink-900">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold leading-4 text-ink-500">{stat.label}</p>
              </Card>
            );
          })}
        </section>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-menta-700" />
            <h2 className="text-lg font-extrabold text-ink-900">QR referral</h2>
          </div>

          <div className="mx-auto w-full max-w-64 rounded-md border-[1.5px] border-ink-100 bg-crema-50 p-4">
            <div className="relative aspect-square overflow-hidden rounded-md bg-white">
              <Image
                src={`/api/qr/referral/${dashboard.code}`}
                alt="QR del link referral"
                fill
                sizes="256px"
                className="object-contain p-2"
              />
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
