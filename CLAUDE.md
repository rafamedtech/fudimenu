# Security Audit Notes

## SEC-02 PrismaMenuRepository Tenant Isolation

Audit date: 2026-04-29

Rule: every tenant-scoped Prisma read or mutation in `src/server/repositories/prisma-menu.repository.ts` must include `tenantId` in `where` filters. `create` calls must write the authenticated `tenantId` into `data`.

- [x] `getTenantBySlug` -> `prisma.tenant.findUnique({ where: { slug } })`
  - Exception: public tenant bootstrap lookup by globally unique tenant slug. No authenticated tenant context exists yet.
- [x] `getMenuByTenantId` -> `prisma.tenant.findUnique({ where: { id: tenantId } })`
  - Tenant guard present via tenant primary key lookup.
- [x] `getMenuByTenantId` -> `prisma.category.findMany({ where: { tenantId, isVisible: true } })`
  - Tenant guard present.
- [x] `getMenuByTenantId` -> `prisma.menuItem.findMany({ where: { tenantId } })`
  - Tenant guard present.
- [x] `getItemsByTenantId` -> `prisma.menuItem.findMany({ where: { tenantId } })`
  - Tenant guard present.
- [x] `toggleItemAvailability` -> `prisma.menuItem.updateMany({ where: { id: itemId, tenantId } })`
  - Tenant guard present.
- [x] `toggleItemAvailability` -> `prisma.menuItem.findFirst({ where: { id: itemId, tenantId } })`
  - Tenant guard present. Converted from `findUnique({ where: { id: itemId } })`.
- [x] `upsertItem` update path -> `prisma.menuItem.updateMany({ where: { id: input.id, tenantId } })`
  - Tenant guard present.
- [x] `upsertItem` update path reread -> `prisma.menuItem.findFirst({ where: { id: input.id, tenantId } })`
  - Tenant guard present. Converted from `findUnique({ where: { id: input.id } })`.
- [x] `upsertItem` create path -> `prisma.menuItem.create({ data: { ...payload, tenantId } })`
  - Tenant assignment present in `data`.

## SEC-03 ESLint Tenant Guard

- [x] Added local ESLint rule `require-tenant-id-in-prisma-findmany`.
- [x] Rule scope is limited to files under `src/server/`.
- [x] Rule reports `.findMany()` calls unless the first argument includes `where: { tenantId }`.
- [x] Intentional exceptions must use an inline `eslint-disable` comment with the security reason.

## SEC-04 E2E Tenant Isolation

- [x] Added `tests/e2e/tenant-isolation.spec.ts`.
- [x] Test creates two real tenants and one menu item per tenant.
- [x] Test verifies `GET /api/items` authenticated as tenant A returns tenant A item and not tenant B item.
- [x] Test verifies `upsertItemAction` authenticated as tenant A cannot update tenant B item by id.
- [x] Added E2E-only cookie auth guarded by `E2E_TEST_AUTH=true`.
- [x] Added disabled-by-default E2E route `POST /api/e2e/upsert-item-action` to invoke the Server Action during Playwright tests.
