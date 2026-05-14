/**
 * E2E spec for the menu-sections feature (TDD).
 *
 * Tests 2 and 3 require:
 *   - `menu_sections` table in Postgres (migration not yet applied)
 *   - `categories.section_id` column
 * → they auto-skip if the schema hasn't been migrated yet.
 *
 * Test 1 is a full browser flow; it will fail at the first missing UI element
 * until the admin section UI is built.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
const PUBLIC_VISIBILITY_TIMEOUT_MS = 65_000;

let prisma: PrismaClient | null = null;

function getTestPrisma() {
  if (!databaseUrl) throw new Error('Missing DATABASE_URL or DIRECT_URL for E2E sections test.');
  prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  return prisma;
}

async function sectionsSchemaReady(): Promise<boolean> {
  try {
    const db = getTestPrisma();
    await db.$queryRaw`SELECT id FROM menu_sections LIMIT 0`;
    await db.$queryRaw`SELECT section_id FROM categories LIMIT 0`;
    return true;
  } catch {
    return false;
  }
}

function authCookies(tenantId: string, userId: string) {
  return `e2e_tenant_id=${tenantId}; e2e_user_id=${userId}`;
}

async function createTenantWithMembership(
  db: PrismaClient,
  suffix: string,
  opts: { plan?: 'free' | 'pro' | 'business' } = {},
) {
  const tenantId = randomUUID();
  const userId = randomUUID();
  const slug = `sec-e2e-${suffix}`;

  await db.tenant.create({
    data: {
      id: tenantId,
      createdBy: userId,
      slug,
      name: `Sec Test ${suffix}`,
      currency: 'MXN',
      plan: opts.plan ?? 'pro',
    },
  });
  await db.membership.create({ data: { tenantId, userId, role: 'owner' } });

  return { tenantId, userId, slug };
}

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Full admin UI flow
// ─────────────────────────────────────────────────────────────────────────────
test.describe('admin crea sección, agrega categoría e item, vista pública muestra', () => {
  test.setTimeout(60_000);

  const tenantIds: string[] = [];

  test.afterEach(async () => {
    if (!databaseUrl || tenantIds.length === 0) return;
    await getTestPrisma().tenant.deleteMany({ where: { id: { in: tenantIds.splice(0) } } });
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('flujo completo: sección → categoría → item → vista pública', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    // TDD: skip in CI until admin section UI is implemented.
    // Set SECTIONS_UI_BUILT=true in CI env to enable once the feature is built.
    test.skip(!!process.env.CI && !process.env.SECTIONS_UI_BUILT, 'TDD placeholder — section admin UI not yet built');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const { tenantId, userId, slug } = await createTenantWithMembership(db, suffix);
    tenantIds.push(tenantId);

    await context.addCookies([
      { name: 'e2e_tenant_id', value: tenantId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
      { name: 'e2e_user_id', value: userId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
    ]);

    // ── 1. Crear sección desde /menu ──────────────────────────────────────────
    await page.goto('/menu');
    await page.getByRole('link', { name: /Crear primera sección/i }).click();
    await expect(page).toHaveURL(/\/menu\/sections\/new$/);
    await page.getByLabel('Nombre').fill('Comida');
    // color: dejamos default (#FFF8E7)
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Card de sección aparece
    await expect(page.getByRole('heading', { name: 'Comida' })).toBeVisible();

    // ── 2. Navegar a página de sección ─────────────────────────────────────────
    await page.getByRole('link', { name: 'Comida', exact: true }).click();
    await expect(page).toHaveURL(/\/menu\/s\//);
    const sectionId = page.url().split('/menu/s/')[1]?.split('?')[0];
    expect(sectionId).toBeTruthy();

    // Estado vacío sin categorías
    await expect(page.getByText(/crea una categoría primero/i)).toBeVisible();

    // ── 3. FAB → editor de item con sectionId en query param ──────────────────
    await page.getByRole('button', { name: /agregar platillo/i }).click();
    await expect(page).toHaveURL(new RegExp(`/menu/new\\?sectionId=${sectionId}`));

    // ── 4. Warning "Crea categoría primero" → CTA ─────────────────────────────
    await expect(page.getByText(/crea categoría primero/i)).toBeVisible();
    await page.getByRole('button', { name: /crear categoría/i }).click();

    // ── 5. Crear categoría "Tacos" ────────────────────────────────────────────
    await page.getByLabel('Nombre de categoría').fill('Tacos');
    await page.getByRole('button', { name: 'Guardar' }).click();
    // De vuelta en el editor: selector de categoría muestra "Tacos"
    await expect(page.getByText('Tacos')).toBeVisible();

    // ── 6. Llenar item y guardar ───────────────────────────────────────────────
    await page.getByLabel('Nombre del platillo').fill('Tacos pastor');
    await page.getByLabel('Precio').fill('120');
    await Promise.all([
      page.waitForURL(new RegExp(`/menu/s/${sectionId}`)),
      page.getByRole('button', { name: 'Guardar' }).click(),
    ]);

    // ── 7. Volver a /menu/s/<id> → item bajo header "Tacos" ───────────────────
    await page.goto(`/menu/s/${sectionId}`);
    await expect(page.getByRole('heading', { name: 'Tacos' })).toBeVisible();
    await expect(page.getByText('Tacos pastor')).toBeVisible();

    // ── 8. Vista pública ───────────────────────────────────────────────────────
    await page.goto(`/m/${slug}`);
    await expect(page.locator('body')).toContainText('Comida');
    await expect(page.locator('body')).toContainText('Tacos');
    await expect(page.locator('body')).toContainText('Tacos pastor');
    await expect(page.locator('body')).toContainText('$120');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Reorder sections via E2E API, verify DB + UI
// ─────────────────────────────────────────────────────────────────────────────
test.describe('reorder secciones persiste sortOrder', () => {
  test.describe.configure({ mode: 'serial' });

  let schemaReady: boolean;

  test.beforeAll(async () => {
    schemaReady = databaseUrl ? await sectionsSchemaReady() : false;
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('reorderSectionsAction persiste nuevo orden en DB', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    test.skip(!schemaReady, 'Requires menu_sections table — run migration first.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const { tenantId, userId } = await createTenantWithMembership(db, suffix);

    const secAId = randomUUID();
    const secBId = randomUUID();
    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES
        (${secAId}::uuid, ${tenantId}::uuid, 'Primero', '#FFF8E7', 0, true),
        (${secBId}::uuid, ${tenantId}::uuid, 'Segundo', '#FFF8E7', 1, true)
    `;

    const res = await request.post('/api/e2e/reorder-sections-action', {
      headers: { cookie: authCookies(tenantId, userId) },
      data: { sectionIds: [secBId, secAId] },
    });
    expect(res.ok()).toBe(true);

    const rows = await db.$queryRaw<Array<{ id: string; sort_order: number }>>`
      SELECT id, sort_order FROM menu_sections
      WHERE tenant_id = ${tenantId}::uuid AND deleted_at IS NULL
      ORDER BY sort_order ASC
    `;
    expect(rows[0]?.id).toBe(secBId);
    expect(rows[1]?.id).toBe(secAId);

    await db.$executeRaw`DELETE FROM menu_sections WHERE tenant_id = ${tenantId}::uuid`;
    await db.tenant.delete({ where: { id: tenantId } });
  });

  test('UI mostra handles en modo reorder', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    test.skip(!schemaReady, 'Requires menu_sections table — run migration first.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const { tenantId, userId } = await createTenantWithMembership(db, suffix);

    const secAId = randomUUID();
    const secBId = randomUUID();
    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES
        (${secAId}::uuid, ${tenantId}::uuid, 'Sec A', '#FFF8E7', 0, true),
        (${secBId}::uuid, ${tenantId}::uuid, 'Sec B', '#E7F8EF', 1, true)
    `;

    await context.addCookies([
      { name: 'e2e_tenant_id', value: tenantId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
      { name: 'e2e_user_id', value: userId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/menu');
    await expect(page.getByRole('heading', { name: 'Sec A' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sec B' })).toBeVisible();

    await page.getByRole('button', { name: 'Reordenar' }).click();
    await expect(page.getByRole('button', { name: 'Mover Sec A' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mover Sec B' })).toBeVisible();

    await db.$executeRaw`DELETE FROM menu_sections WHERE tenant_id = ${tenantId}::uuid`;
    await db.tenant.delete({ where: { id: tenantId } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Reorder categories via E2E API
// ─────────────────────────────────────────────────────────────────────────────
test.describe('reorder categorías persiste sortOrder', () => {
  test.describe.configure({ mode: 'serial' });

  let schemaReady: boolean;

  test.beforeAll(async () => {
    schemaReady = databaseUrl ? await sectionsSchemaReady() : false;
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('reorderCategoriesAction persiste nuevo orden en DB', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    test.skip(!schemaReady, 'Requires menu_sections table — run migration first.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const { tenantId, userId } = await createTenantWithMembership(db, suffix);

    const sectionId = randomUUID();
    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES (${sectionId}::uuid, ${tenantId}::uuid, 'Sec', '#FFF8E7', 0, true)
    `;

    const catAId = randomUUID();
    const catBId = randomUUID();
    await db.$executeRaw`
      INSERT INTO categories (id, tenant_id, section_id, name, sort_order)
      VALUES
        (${catAId}::uuid, ${tenantId}::uuid, ${sectionId}::uuid, 'Cat A', 0),
        (${catBId}::uuid, ${tenantId}::uuid, ${sectionId}::uuid, 'Cat B', 1)
    `;

    const res = await request.post('/api/e2e/reorder-categories-action', {
      headers: { cookie: authCookies(tenantId, userId) },
      data: { sectionId, categoryIds: [catBId, catAId] },
    });
    expect(res.ok()).toBe(true);

    const rows = await db.$queryRaw<Array<{ id: string; sort_order: number }>>`
      SELECT id, sort_order FROM categories
      WHERE tenant_id = ${tenantId}::uuid AND deleted_at IS NULL
      ORDER BY sort_order ASC
    `;
    expect(rows[0]?.id).toBe(catBId);
    expect(rows[1]?.id).toBe(catAId);

    await db.$executeRaw`DELETE FROM menu_sections WHERE tenant_id = ${tenantId}::uuid`;
    await db.tenant.delete({ where: { id: tenantId } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Delete item + undo (restaurar)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('eliminar item con undo lo restaura', () => {
  test.setTimeout(30_000);

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('borrar platillo → Deshacer → platillo visible de nuevo', async ({ page, context }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const { tenantId, userId } = await createTenantWithMembership(db, suffix);

    const sectionId = randomUUID();
    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES (${sectionId}::uuid, ${tenantId}::uuid, 'Sec Undo', '#FFF8E7', 0, true)
    `;

    const categoryId = randomUUID();
    await db.$executeRaw`
      INSERT INTO categories (id, tenant_id, section_id, name, sort_order)
      VALUES (${categoryId}::uuid, ${tenantId}::uuid, ${sectionId}::uuid, 'Cat Undo', 0)
    `;

    const itemId = randomUUID();
    await db.menuItem.create({
      data: {
        id: itemId,
        tenantId,
        categoryId,
        name: 'Platillo undo test',
        priceCents: 5000,
        currency: 'MXN',
        isAvailable: true,
        sortOrder: 0,
      },
    });

    await context.addCookies([
      { name: 'e2e_tenant_id', value: tenantId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
      { name: 'e2e_user_id', value: userId, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' },
    ]);

    // Navigate to item editor
    await page.goto(`/menu/${itemId}?sectionId=${sectionId}`);
    await expect(page.getByRole('textbox', { name: 'Nombre del platillo' })).toHaveValue('Platillo undo test');

    // Delete
    await page.getByRole('button', { name: 'Eliminar platillo' }).click();

    // Wait for redirect to section detail
    await page.waitForURL(new RegExp(`/menu/s/${sectionId}`));

    // Toast with undo button
    await expect(page.getByRole('button', { name: 'Deshacer' })).toBeVisible();
    await page.getByRole('button', { name: 'Deshacer' }).click();

    // Item reappears in section list after refresh
    await expect(page.getByText('Platillo undo test')).toBeVisible({ timeout: 10_000 });

    // Verify item not soft-deleted in DB
    const item = await db.menuItem.findUnique({ where: { id: itemId } });
    expect(item?.deletedAt).toBeNull();

    await db.menuItem.delete({ where: { id: itemId } });
    await db.$executeRaw`DELETE FROM menu_sections WHERE tenant_id = ${tenantId}::uuid`;
    await db.tenant.delete({ where: { id: tenantId } });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Tenant isolation para secciones
// ─────────────────────────────────────────────────────────────────────────────
test.describe('tenant A no puede ver/editar secciones de tenant B', () => {
  test.describe.configure({ mode: 'serial' });

  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;
  let sectionAId: string;
  let sectionBId: string;
  let schemaReady: boolean;

  test.beforeAll(async () => {
    schemaReady = databaseUrl ? await sectionsSchemaReady() : false;
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test.beforeEach(async () => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    test.skip(!schemaReady, 'Requires menu_sections table — run migration first.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);

    tenantAId = randomUUID();
    tenantBId = randomUUID();
    userAId = randomUUID();
    userBId = randomUUID();
    sectionAId = randomUUID();
    sectionBId = randomUUID();

    await db.tenant.createMany({
      data: [
        { id: tenantAId, slug: `iso-a-${suffix}`, name: 'Iso Tenant A', currency: 'MXN' },
        { id: tenantBId, slug: `iso-b-${suffix}`, name: 'Iso Tenant B', currency: 'MXN' },
      ],
    });
    await db.membership.createMany({
      data: [
        { tenantId: tenantAId, userId: userAId, role: 'owner' },
        { tenantId: tenantBId, userId: userBId, role: 'owner' },
      ],
    });

    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES
        (${sectionAId}::uuid, ${tenantAId}::uuid, 'Sección A', '#FFF8E7', 0, true),
        (${sectionBId}::uuid, ${tenantBId}::uuid, 'Sección B', '#FFF8E7', 0, true)
    `;
  });

  test.afterEach(async () => {
    if (!databaseUrl || !schemaReady) return;
    const db = getTestPrisma();
    await db.$executeRaw`
      DELETE FROM menu_sections
      WHERE tenant_id = ${tenantAId}::uuid OR tenant_id = ${tenantBId}::uuid
    `;
    await db.auditLog.deleteMany({
      where: {
        OR: [
          { tenantId: { in: [tenantAId, tenantBId] } },
          { actorUserId: { in: [userAId, userBId] } },
        ],
      },
    });
    await db.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
  });

  test('GET /menu/s/<sectionBId> retorna 404 para tenant A', async ({ request }) => {
    const response = await request.get(`/menu/s/${sectionBId}`, {
      headers: { cookie: authCookies(tenantAId, userAId) },
    });
    expect(response.status()).toBe(404);
  });

  test('upsertSectionAction con id de tenant B retorna not_found', async ({ request }) => {
    const response = await request.post('/api/e2e/upsert-section-action', {
      headers: { cookie: authCookies(tenantAId, userAId) },
      data: {
        id: sectionBId,
        name: 'Overwrite attempt',
        accentColor: '#FF0000',
      },
    });
    expect(response.status()).toBe(404);

    // Sección B intacta
    const db = getTestPrisma();
    const rows = await db.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM menu_sections WHERE id = ${sectionBId}::uuid
    `;
    expect(rows[0]?.name).toBe('Sección B');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Soft delete oculta sección del menú público
// ─────────────────────────────────────────────────────────────────────────────
test.describe('soft delete sección quita del menú público', () => {
  test.setTimeout(PUBLIC_VISIBILITY_TIMEOUT_MS + 15_000);

  let schemaReady: boolean;

  test.beforeAll(async () => {
    schemaReady = databaseUrl ? await sectionsSchemaReady() : false;
  });

  test.afterAll(async () => {
    await prisma?.$disconnect();
  });

  test('sección borrada no aparece en /m/<slug>', async ({ request }) => {
    test.skip(!databaseUrl, 'Missing DATABASE_URL or DIRECT_URL.');
    test.skip(!schemaReady, 'Requires menu_sections table and categories.section_id column — run migration first.');

    const db = getTestPrisma();
    const suffix = randomUUID().slice(0, 8);
    const tenantId = randomUUID();
    const userId = randomUUID();
    const sectionId = randomUUID();
    const categoryId = randomUUID();
    const itemId = randomUUID();
    const slug = `sec-del-${suffix}`;

    await db.tenant.create({
      data: {
        id: tenantId,
        createdBy: userId,
        slug,
        name: `Del Sec ${suffix}`,
        currency: 'MXN',
        plan: 'pro',
      },
    });
    await db.membership.create({ data: { tenantId, userId, role: 'owner' } });

    await db.$executeRaw`
      INSERT INTO menu_sections (id, tenant_id, name, accent_color, sort_order, is_visible)
      VALUES (${sectionId}::uuid, ${tenantId}::uuid, 'Desayunos', '#FFF8E7', 0, true)
    `;
    await db.$executeRaw`
      INSERT INTO categories (id, tenant_id, section_id, name, sort_order)
      VALUES (${categoryId}::uuid, ${tenantId}::uuid, ${sectionId}::uuid, 'Huevos', 0)
    `;
    await db.menuItem.create({
      data: {
        id: itemId,
        tenantId,
        categoryId,
        name: 'Huevos rancheros',
        priceCents: 9500,
        currency: 'MXN',
        isAvailable: true,
        sortOrder: 0,
      },
    });

    // Verificar que la sección aparece en menú público
    const beforeHtml = await (await request.get(`/m/${slug}`)).text();
    expect(beforeHtml).toContain('Desayunos');
    expect(beforeHtml).toContain('Huevos rancheros');

    // Soft delete vía endpoint E2E
    const deleteRes = await request.post('/api/e2e/delete-section-action', {
      headers: { cookie: authCookies(tenantId, userId) },
      data: { sectionId },
    });
    expect(deleteRes.ok()).toBe(true);

    // Sección desaparece del menú público tras ISR revalidation
    await expect
      .poll(
        async () => (await request.get(`/m/${slug}`)).text(),
        { timeout: PUBLIC_VISIBILITY_TIMEOUT_MS, intervals: [500, 1000, 2000, 5000] },
      )
      .not.toContain('Desayunos');

    // Cleanup
    await db.$executeRaw`DELETE FROM menu_sections WHERE id = ${sectionId}::uuid`;
    await db.tenant.delete({ where: { id: tenantId } });
  });
});
