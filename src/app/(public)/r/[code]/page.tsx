import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { startReferralSignupAction } from '@/server/actions/referral.actions';
import { referralService } from '@/server/services/referral.service';

type ReferralPageProps = {
  params: Promise<{
    code: string;
  }>;
};

function getSignupUrl(code: string, restaurantSlug: string) {
  const searchParams = new URLSearchParams({
    utm_source: 'referral',
    utm_medium: 'restaurant',
    utm_campaign: code,
    utm_content: restaurantSlug,
  });

  return `/onboarding?${searchParams.toString()}`;
}

export default async function ReferralLandingPage({ params }: ReferralPageProps) {
  const { code } = await params;
  const referral = await referralService.getLandingByCode(code);

  if (!referral) {
    notFound();
  }

  const landing = referral;
  const signupUrl = getSignupUrl(landing.code, landing.restaurantSlug);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-md border-[1.5px] border-ink-100 bg-white p-6 shadow-md">
        <p className="text-sm font-bold uppercase text-mostaza-700">Invitacion de restaurante</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900">
          Recomendado por {landing.restaurantName}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink-600">
          Crea tu menu digital en minutos y deja que tus clientes vean platillos, precios y
          especiales desde cualquier QR.
        </p>

        <form action={startReferralSignupAction} className="mt-6">
          <input type="hidden" name="code" value={landing.code} />
          <input type="hidden" name="referrerId" value={landing.referrerId} />
          <input type="hidden" name="restaurantSlug" value={landing.restaurantSlug} />
          <input type="hidden" name="signupUrl" value={signupUrl} />
          <Button type="submit" size="lg" className="w-full">
            Crear mi menu gratis
          </Button>
        </form>

        <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-ink-500 underline">
          Ya tengo cuenta
        </Link>
      </div>
    </main>
  );
}
