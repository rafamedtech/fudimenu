// Root provider is intentionally minimal — no admin-only deps (QueryClient, Toaster, PostHog)
// so the public menu route stays under 100 KB First Load JS.
// Admin-specific providers live in src/components/admin-providers.tsx.
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
