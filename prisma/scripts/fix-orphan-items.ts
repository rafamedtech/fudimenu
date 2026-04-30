import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DIRECT_URL or DATABASE_URL. Add your Supabase Postgres URL to .env.');
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  await client.connect();
  await client.query('BEGIN');

  try {
    const before = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM items
        WHERE category_id IS NULL
          AND deleted_at IS NULL
      `,
    );

    const result = await client.query<{ updated_items: string; affected_tenants: string }>(
      `
        WITH orphan_tenants AS (
          SELECT DISTINCT tenant_id
          FROM items
          WHERE category_id IS NULL
            AND deleted_at IS NULL
        ),
        default_categories AS (
          INSERT INTO categories (
            tenant_id,
            name,
            sort_order,
            is_visible,
            deleted_at
          )
          SELECT
            tenant_id,
            'Otros',
            999,
            TRUE,
            NULL
          FROM orphan_tenants
          ON CONFLICT (tenant_id, name) DO UPDATE SET
            is_visible = TRUE,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id, tenant_id
        ),
        updated AS (
          UPDATE items AS item
          SET
            category_id = category.id,
            updated_at = CURRENT_TIMESTAMP
          FROM default_categories AS category
          WHERE item.tenant_id = category.tenant_id
            AND item.category_id IS NULL
            AND item.deleted_at IS NULL
          RETURNING item.id, item.tenant_id
        )
        SELECT
          COUNT(*)::text AS updated_items,
          COUNT(DISTINCT tenant_id)::text AS affected_tenants
        FROM updated
      `,
    );

    await client.query('COMMIT');

    const orphanItemsBefore = Number(before.rows[0]?.count ?? 0);
    const updatedItems = Number(result.rows[0]?.updated_items ?? 0);
    const affectedTenants = Number(result.rows[0]?.affected_tenants ?? 0);

    console.log(
      `Assigned ${updatedItems}/${orphanItemsBefore} orphan items to Otros across ${affectedTenants} tenants.`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
