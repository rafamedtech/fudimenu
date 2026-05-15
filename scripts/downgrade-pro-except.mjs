import fs from 'node:fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

for (const file of ['.env', '.env.local']) {
  if (fs.existsSync(file)) {
    const parsed = dotenv.parse(fs.readFileSync(file));
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const KEEP_EMAIL = process.argv[2] ?? 'rafamed.tech@gmail.com';
const DRY_RUN = process.argv.includes('--dry-run');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!supabaseUrl || !serviceKey || !databaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DATABASE_URL/DIRECT_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let keepUserId = null;
let page = 1;
const perPage = 200;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error('supabase listUsers error', error);
    process.exit(1);
  }
  const match = data.users.find((u) => (u.email ?? '').toLowerCase() === KEEP_EMAIL.toLowerCase());
  if (match) {
    keepUserId = match.id;
    break;
  }
  if (data.users.length < perPage) break;
  page += 1;
}
if (!keepUserId) {
  console.error(`User ${KEEP_EMAIL} not found in Supabase Auth`);
  process.exit(1);
}
console.log(`Keep user: ${KEEP_EMAIL} → id ${keepUserId}`);

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

const keepTenantsResult = await client.query(
  `SELECT tenant_id FROM memberships WHERE user_id=$1::uuid AND deleted_at IS NULL`,
  [keepUserId],
);
const keepTenantIds = keepTenantsResult.rows.map((r) => r.tenant_id);
console.log(`Keep tenants (${keepTenantIds.length}):`, keepTenantIds);

const targetsResult = await client.query(
  `SELECT id, name, plan FROM tenants
   WHERE plan IN ('pro','business') AND deleted_at IS NULL
   ${keepTenantIds.length ? `AND id <> ALL($1::uuid[])` : ''}`,
  keepTenantIds.length ? [keepTenantIds] : [],
);
console.log(`\nTenants to downgrade: ${targetsResult.rows.length}`);
for (const t of targetsResult.rows) {
  console.log(`  - ${t.id} ${t.name} (${t.plan})`);
}

if (DRY_RUN) {
  console.log('\nDRY RUN — no changes. Re-run without --dry-run to apply.');
  await client.end();
  process.exit(0);
}

if (targetsResult.rows.length === 0) {
  console.log('Nothing to do.');
  await client.end();
  process.exit(0);
}

await client.query('BEGIN');
try {
  const ids = targetsResult.rows.map((t) => t.id);
  const updated = await client.query(
    `UPDATE tenants SET plan='free', stripe_subscription_id=NULL WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  for (const t of targetsResult.rows) {
    await client.query(
      `INSERT INTO audit_log (tenant_id, action, entity_type, entity_id, metadata)
       VALUES ($1::uuid, 'plan.downgraded', 'tenant', $1::uuid, $2::jsonb)`,
      [
        t.id,
        JSON.stringify({
          from: t.plan,
          to: 'free',
          reason: 'bulk_downgrade_script',
          keptUser: KEEP_EMAIL,
        }),
      ],
    );
  }
  await client.query('COMMIT');
  console.log(`\nDowngraded ${updated.rowCount} tenants. Audit logs written.`);
  console.log('Note: Stripe subscriptions NOT canceled. Cancel manually via dashboard if needed.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Transaction failed, rolled back', err);
  process.exit(1);
} finally {
  await client.end();
}
