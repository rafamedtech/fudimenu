import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getUserMemberships } from '@/server/guards/get-user-memberships';
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

  if (!isAddingMenu && process.env.USE_MOCKS !== 'true') {
    let userId: string | null = null;

    if (process.env.E2E_TEST_AUTH === 'true') {
      const cookieStore = await cookies();
      userId = cookieStore.get('e2e_user_id')?.value ?? null;
    } else {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    if (userId) {
      const memberships = await getUserMemberships(userId);
      if (memberships.length > 0) redirect('/menu');
    }
  }

  return (
    <Suspense>
      <OnboardingClient isAddingMenu={isAddingMenu} />
    </Suspense>
  );
}
