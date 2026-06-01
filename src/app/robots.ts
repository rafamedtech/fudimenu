import type { MetadataRoute } from 'next';
import { getAbsoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/legal/', '/m/'],
      disallow: [
        '/api/',
        '/account/',
        '/analytics/',
        '/auth/',
        '/dashboard/',
        '/login',
        '/menu/',
        '/onboarding',
        '/qr/',
        '/r/',
        '/settings/',
        '/sentry-example-page',
      ],
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
  };
}
