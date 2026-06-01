import type { MetadataRoute } from 'next';
import { getPrisma } from '@/lib/db/prisma';
import { mockTenant } from '@/lib/mock/data';
import { getAbsoluteUrl } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const staticRoutes = ['/', '/legal/privacy', '/legal/terms', '/legal/dpa'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: getAbsoluteUrl(route),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.3,
  }));

  const tenants =
    process.env.USE_MOCKS === 'true'
      ? [{ slug: mockTenant.slug, updatedAt: new Date(mockTenant.createdAt) }]
      : await getPrisma().tenant.findMany({
          where: { deletedAt: null },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        });

  const menuEntries: MetadataRoute.Sitemap = tenants.map((tenant) => ({
    url: getAbsoluteUrl(`/m/${tenant.slug}`),
    lastModified: tenant.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticEntries, ...menuEntries];
}
