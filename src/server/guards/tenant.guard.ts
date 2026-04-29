import 'server-only';
import { ApiError } from '@/lib/api/errors';

export function withTenantGuard<T>(
  tenantId: string,
  query: (tenantId: string) => Promise<T>,
): Promise<T> {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new ApiError(403, 'forbidden', 'Missing tenant context');
  }

  return query(tenantId);
}
