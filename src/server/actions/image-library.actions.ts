'use server';
import { requireAuth } from '@/server/guards/require-auth';
import { menuService } from '@/server/services/menu.service';

type ImageLibraryResult =
  | { ok: true; images: string[] }
  | { ok: false; code: 'unauthorized' };

function isRedirectError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT;')
  );
}

/**
 * Admin-only image library for the active tenant: deduped URLs already used
 * across the tenant's brand, sections, categories and items. Tenant-scoped via
 * requireAuth — never returns images from another tenant. Not part of any
 * public render path.
 */
export async function listTenantImagesAction(): Promise<ImageLibraryResult> {
  let ctx;
  try {
    ctx = await requireAuth();
  } catch (error) {
    if (isRedirectError(error)) return { ok: false, code: 'unauthorized' };
    throw error;
  }

  const images = await menuService.getImageLibrary(ctx.tenantId);
  return { ok: true, images };
}
