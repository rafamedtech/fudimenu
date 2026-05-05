'use client';

import { AdminSegmentErrorBoundary } from '../_components/admin-segment-error-boundary';

export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AdminSegmentErrorBoundary
      error={error}
      reset={reset}
      segment="menu"
      title="No pudimos cargar el menú"
      description="La administración del menú falló al cargar. Ya registramos el error para revisarlo."
    />
  );
}
