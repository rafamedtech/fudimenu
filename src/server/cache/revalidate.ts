import { revalidateTag } from 'next/cache';

function isMissingStaticGenerationStore(error: unknown) {
  return error instanceof Error && error.message.includes('static generation store missing');
}

export function revalidateTenantCache(tenantId: string, slug?: string | null) {
  const tags = [`menu:${tenantId}`, `tenant:${tenantId}`];
  if (slug) tags.push(`tenant-slug:${slug}`);

  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (error) {
      if (process.env.NODE_ENV === 'test' && isMissingStaticGenerationStore(error)) continue;
      throw error;
    }
  }
}
