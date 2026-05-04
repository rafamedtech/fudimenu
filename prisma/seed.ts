import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL. Add your Supabase Postgres URL to .env.');
}

const tenantId = '00000000-0000-4000-8000-000000000001';

const categories = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Tacos',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Bebidas',
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    name: 'Postres',
    sortOrder: 2,
    isVisible: true,
  },
] as const;

const items = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    categoryId: categories[0].id,
    name: 'Tacos al pastor',
    description: 'Carne marinada con achiote y piña, en tortilla de maíz.',
    priceCents: 12000,
    currency: 'MXN',
    imageUrl: null,
    isAvailable: true,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    categoryId: categories[0].id,
    name: 'Tacos de suadero',
    description: 'Suadero suave en tortilla recién hecha.',
    priceCents: 11000,
    currency: 'MXN',
    imageUrl: null,
    isAvailable: true,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    categoryId: categories[1].id,
    name: 'Agua de horchata',
    description: 'Bebida tradicional de arroz y canela.',
    priceCents: 4500,
    currency: 'MXN',
    imageUrl: null,
    isAvailable: false,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000000204',
    categoryId: categories[2].id,
    name: 'Flan de la casa',
    description: 'Receta de la abuela.',
    priceCents: 6500,
    currency: 'MXN',
    imageUrl: null,
    isAvailable: true,
    sortOrder: 0,
  },
] as const;

const client = new Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  await client.connect();
  await client.query('BEGIN');

  try {
    await client.query(
      `
        INSERT INTO tenants (
          id,
          slug,
          name,
          logo_url,
          whatsapp_phone,
          business_hours,
          primary_color,
          cuisine_type,
          default_locale,
          currency,
          plan,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::"Locale", $10, $11::"TenantPlan", NULL)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          logo_url = EXCLUDED.logo_url,
          whatsapp_phone = EXCLUDED.whatsapp_phone,
          business_hours = EXCLUDED.business_hours,
          primary_color = EXCLUDED.primary_color,
          cuisine_type = EXCLUDED.cuisine_type,
          default_locale = EXCLUDED.default_locale,
          currency = EXCLUDED.currency,
          plan = EXCLUDED.plan,
          deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      `,
      [
        tenantId,
        'taqueria-don-pepe',
        'Taquería Don Pepe',
        null,
        null,
        null,
        '#F4B400',
        'mexicana',
        'es',
        'MXN',
        'free',
      ],
    );

    for (const category of categories) {
      await client.query(
        `
          INSERT INTO categories (
            id,
            tenant_id,
            name,
            sort_order,
            is_visible,
            deleted_at
          )
          VALUES ($1, $2, $3, $4, $5, NULL)
          ON CONFLICT (tenant_id, name) DO UPDATE SET
            sort_order = EXCLUDED.sort_order,
            is_visible = EXCLUDED.is_visible,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        `,
        [category.id, tenantId, category.name, category.sortOrder, category.isVisible],
      );
    }

    for (const item of items) {
      await client.query(
        `
          INSERT INTO items (
            id,
            tenant_id,
            category_id,
            name,
            description,
            price_cents,
            currency,
            image_url,
            is_available,
            sort_order,
            deleted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)
          ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            category_id = EXCLUDED.category_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price_cents = EXCLUDED.price_cents,
            currency = EXCLUDED.currency,
            image_url = EXCLUDED.image_url,
            is_available = EXCLUDED.is_available,
            sort_order = EXCLUDED.sort_order,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          item.id,
          tenantId,
          item.categoryId,
          item.name,
          item.description,
          item.priceCents,
          item.currency,
          item.imageUrl,
          item.isAvailable,
          item.sortOrder,
        ],
      );
    }

    await client.query('COMMIT');
    console.log('Seeded demo tenant taqueria-don-pepe with 3 categories and 4 items.');
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
