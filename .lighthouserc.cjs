/** @type {import('@lhci/cli').LighthouseRcConfig} */
// MVP decision (2026-05-13): admin `/menu` is auth-gated (redirects to
// /login?next=/menu without a Supabase session). Scripting a real auth flow in
// LHCI CI is brittle (magic-link + Google OAuth + tenant cookie), so the
// automated gate audits two PUBLIC routes that share the admin shell's chunks:
//   - `/m/[slug]` — comensal critical path (MVP perf SLA)
//   - `/`        — public landing (uses next/link, shared baseline 102 kB)
// Admin `/menu` Lighthouse stays a manual local check (see MVP.md §Audit 5).
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/m/taqueria-don-pepe',
        'http://localhost:3000/',
      ],
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 4,
        },
        chromeFlags: '--no-sandbox',
      },
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1500 }],
        // INP only available with field data; lab uses TBT as proxy
        'interaction-to-next-paint': 'off',
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        // PWA checks not required for MVP
        'installable-manifest': 'off',
        'maskable-icon': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'bf-cache': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
