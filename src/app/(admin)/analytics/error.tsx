'use client';

import { AdminSegmentErrorBoundary } from '../_components/admin-segment-error-boundary';

export default function AnalyticsError({
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
      segment="analytics"
      title="No pudimos cargar analytics"
      description="Las métricas fallaron al cargar. Ya registramos el error para revisarlo."
    />
  );
}
