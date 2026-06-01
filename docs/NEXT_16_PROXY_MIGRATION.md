# Next 16 Proxy Migration

FudiMenu currently runs Next.js 15, so `src/middleware.ts` remains the active file convention.
The request logic lives in `src/server/request-proxy.ts`; the framework adapter is intentionally
small so the future Next.js 16 migration does not mix behavior changes with the convention rename.

## When upgrading to Next.js 16

1. Upgrade Next.js and `eslint-config-next` together.
2. Run the official codemod:

   ```bash
   npx @next/codemod@latest middleware-to-proxy .
   ```

3. Confirm that `src/middleware.ts` became `src/proxy.ts`.
4. Confirm that the named export changed from `middleware` to `proxy`.
5. Keep the exported object named `config`; Next.js 16 still uses `config.matcher`.
6. Rename `tests/unit/middleware.test.ts` and its adapter import to `proxy`.
7. Run:

   ```bash
   pnpm test --run tests/unit/proxy.test.ts
   pnpm typecheck
   pnpm build
   ```

## Behavior that must remain unchanged

- Protected admin routes redirect unauthenticated users to `/login?next=...`.
- Authenticated users without an active tenant redirect to `/onboarding`.
- Public routes skip Supabase session refresh.
- Locale resolution still prioritizes `?lang=`, then cookie, then `Accept-Language`.
- CSP remains present and the request `x-nonce` matches the CSP script nonce.
- The matcher continues excluding Next static assets, images, favicon, webhook requests, and image files.

Official references:
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
- https://nextjs.org/docs/app/guides/upgrading/codemods#middleware-to-proxy
