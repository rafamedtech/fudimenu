import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OnboardingClient } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Configura tu menú | FudiMenu',
  description: 'Crea tu menú digital y publica tu primer platillo.',
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const isAddingMenu = (await searchParams).new === '1';

  return (
    <Suspense>
      <OnboardingClient isAddingMenu={isAddingMenu} />
    </Suspense>
  );
}
