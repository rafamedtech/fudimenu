import { Suspense } from 'react';
import { LoginClient } from './login-client';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith('/') ? next : '/dashboard';

  return (
    <Suspense>
      <LoginClient nextPath={nextPath} />
    </Suspense>
  );
}
