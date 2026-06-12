import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});
const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

const config: NextConfig = {
  reactStrictMode: true,
  htmlLimitedBots: /HeadlessChrome|Chrome-Lighthouse|Lighthouse/,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'randomuser.me' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const baseHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    if (isProd) {
      baseHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }
    return [
      { source: '/(.*)', headers: baseHeaders },
      // /m/* se permite en iframes same-origin (vista previa admin); la última regla gana.
      {
        source: '/m/:path*',
        headers: baseHeaders.map((h) =>
          h.key === 'X-Frame-Options' ? { key: h.key, value: 'SAMEORIGIN' } : h,
        ),
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(withNextIntl(config)), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG ?? 'rafamed',

  project: process.env.SENTRY_PROJECT ?? 'javascript-nextjs',

  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  telemetry: false,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: hasSentryAuthToken,
  release: {
    create: hasSentryAuthToken,
  },
  sourcemaps: {
    disable: !hasSentryAuthToken,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: '/monitoring',

  // Span-based cron monitoring supports App Router route handlers.
  _experimental: {
    vercelCronsMonitoring: true,
  },

  webpack: {
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
