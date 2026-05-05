'use client';

import { AdminSegmentErrorBoundary } from '../_components/admin-segment-error-boundary';

export default function DashboardError({
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
      segment="dashboard"
      title="No pudimos cargar el dashboard"
      description="El resumen del negocio falló al cargar. Ya registramos el error para revisarlo."
    />
  );
}
