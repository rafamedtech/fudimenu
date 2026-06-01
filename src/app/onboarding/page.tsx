import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OnboardingClient } from './onboarding-client';

export const metadata: Metadata = {
  title: 'Crear menú',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingClient />
    </Suspense>
  );
}
