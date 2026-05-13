import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env.local' });
config({ path: '.env' });

const databaseUrl = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL or DIRECT_URL. Add your Supabase Postgres URL to .env.');
}

const tenantId = process.env.SEED_MARENCA_TENANT_ID ?? '00000000-0000-4000-8000-000000010001';
const tenantSlug = process.env.SEED_MARENCA_TENANT_SLUG ?? 'marenca-grupo-moderno';
const tenantName = process.env.SEED_MARENCA_TENANT_NAME ?? 'Marenca';
const tenantPlan = process.env.SEED_MARENCA_TENANT_PLAN ?? 'business';
const tenantWhatsappPhone = process.env.SEED_MARENCA_WHATSAPP_PHONE ?? null;
const dataIdNamespace = process.env.SEED_MARENCA_DATA_ID_NAMESPACE ?? '00000001';

function scopedDataId(id: string) {
  return id.replace(/00000001(\d{4})$/, `${dataIdNamespace}$1`);
}

const rawSections = [
  {
    id: '00000000-0000-4000-8000-000000011001',
    name: 'Tortilla de huevos',
    accentColor: '#FFF8E7',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000011002',
    name: 'Enchiladas',
    accentColor: '#F7EFE1',
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000011003',
    name: 'Chilaquiles',
    accentColor: '#FFF3D8',
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000011004',
    name: 'Cazuelas',
    accentColor: '#F4ECE4',
    sortOrder: 3,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000011005',
    name: 'Especialidades Marenca',
    accentColor: '#F9F0DA',
    sortOrder: 4,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000011006',
    name: 'Jugos naturales',
    accentColor: '#EEF6E8',
    sortOrder: 5,
    isVisible: true,
  },
] as const;

const sections = rawSections.map((section) => ({
  ...section,
  id: scopedDataId(section.id),
}));

const rawCategories = [
  {
    id: '00000000-0000-4000-8000-000000012001',
    sectionId: sections[0].id,
    name: 'Omelettes',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012002',
    sectionId: sections[1].id,
    name: 'Enchiladas 4 piezas',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012003',
    sectionId: sections[2].id,
    name: 'Chilaquiles',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012004',
    sectionId: sections[3].id,
    name: 'Cazuelas',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012005',
    sectionId: sections[4].id,
    name: 'Especialidades',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012006',
    sectionId: sections[5].id,
    name: 'Jugos',
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: '00000000-0000-4000-8000-000000012007',
    sectionId: sections[5].id,
    name: 'Bebidas calientes',
    sortOrder: 1,
    isVisible: true,
  },
] as const;

const categories = rawCategories.map((category) => ({
  ...category,
  id: scopedDataId(category.id),
}));

const rawItems = [
  {
    id: '00000000-0000-4000-8000-000000013001',
    categoryId: categories[0].id,
    name: 'Azapotzalco',
    description:
      'Omelette de chicharrón prensado estilo Ciudad de México, bañado en salsa de chiles secos y acompañado de nopales en trozos.',
    priceCents: 28500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013002',
    categoryId: categories[0].id,
    name: 'Trincheras',
    description:
      'Omelette de machaca de res sonorense preparada con jitomate y cebolla, cubierta con salsa ranchera sofrita.',
    priceCents: 28500,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013003',
    categoryId: categories[0].id,
    name: 'Yagul',
    description:
      'Omelette de lengua de res cocida lentamente al vapor, con queso panela y salsa verde de tomatillo milpero.',
    priceCents: 29500,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013004',
    categoryId: categories[0].id,
    name: 'Xxime',
    description:
      'Omelette de pulpo salteado en salsa de chile de árbol, ancho y guajillo en aceite de oliva, terminado con crema de chile chipotle.',
    priceCents: 29000,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013005',
    categoryId: categories[0].id,
    name: 'Kuyukion',
    description:
      'Omelette de salmón de Alaska, espárragos, cebolla y pimiento morrón, cubierto con una suave crema de cilantro.',
    priceCents: 29000,
    sortOrder: 4,
  },
  {
    id: '00000000-0000-4000-8000-000000013006',
    categoryId: categories[0].id,
    name: 'Xel-Há',
    description:
      'Omelette de mariscos con salmón, camarón y pulpo, acompañado de una salsa elaborada a base de langosta y almeja.',
    priceCents: 29500,
    sortOrder: 5,
  },
  {
    id: '00000000-0000-4000-8000-000000013007',
    categoryId: categories[0].id,
    name: 'Tarahumara',
    description:
      'Omelette de hongo portobello salteado al vino blanco, con queso crema, cubierto con crema de champiñones.',
    priceCents: 25500,
    sortOrder: 6,
  },
  {
    id: '00000000-0000-4000-8000-000000013008',
    categoryId: categories[0].id,
    name: 'Quitzaali',
    description:
      'Omelette de espárragos salteados, tomates deshidratados y queso de cabra cenizo, cubierto con crema de chile poblano.',
    priceCents: 25500,
    sortOrder: 7,
  },
  {
    id: '00000000-0000-4000-8000-000000013009',
    categoryId: categories[0].id,
    name: 'Xochitl',
    description:
      'Omelette con lajas de plátano macho, relleno de queso Monterey Jack, bañado en mole oaxaqueño y acompañado de chilaquiles.',
    priceCents: 23500,
    sortOrder: 8,
  },
  {
    id: '00000000-0000-4000-8000-000000013010',
    categoryId: categories[1].id,
    name: 'Tlachomolli',
    description:
      'Enchiladas de lechón en dobladitas de tortilla de plátano macho, bañadas en mole de dátil estilo Marenca.',
    priceCents: 27500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013011',
    categoryId: categories[1].id,
    name: 'Miztli',
    description:
      'Enchiladas rellenas de lengua de res, acompañadas de la tradicional salsa de tomatillo y bañadas en salsa verde.',
    priceCents: 28000,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013012',
    categoryId: categories[1].id,
    name: 'Olmeca',
    description:
      'Enchiladas de cabeza de res horneada en su propio jugo, con reducción de vinos y cubierta con pipián cremoso.',
    priceCents: 26500,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013013',
    categoryId: categories[1].id,
    name: 'Maya',
    description:
      'Enchiladas de cochinita pibil reposada en adobo maya, horneada en hojas de plátano, con salsa de achiote y cebolla morada.',
    priceCents: 26500,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013014',
    categoryId: categories[2].id,
    name: 'Totihuacán',
    description:
      'Chilaquiles Marenca con huevo, chorizo y salsa roja de jitomate y chile chipotle, adornados con queso panela, Cotija y crema.',
    priceCents: 27500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013015',
    categoryId: categories[2].id,
    name: 'Muli',
    description:
      'Chilaquiles con mole negro de Oaxaca, tortilla crocante, pechuga de pollo o huevo al gusto y jocoque de Castilla.',
    priceCents: 27500,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013016',
    categoryId: categories[2].id,
    name: 'Zacachila',
    description:
      'Chilaquiles con lengua de res en salsa verde de tomatillo, terminados con queso panela fresco.',
    priceCents: 29000,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013017',
    categoryId: categories[2].id,
    name: 'Chicali',
    description:
      'Chilaquiles con camarones frescos en salsa diabla de chile chiltepín, queso panela fresco y aguacate.',
    priceCents: 28500,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013018',
    categoryId: categories[2].id,
    name: 'Huichol',
    description:
      'Chilaquiles con cecina ahumada en leña de encino y una ligera crema de chile chipotle.',
    priceCents: 29500,
    sortOrder: 4,
  },
  {
    id: '00000000-0000-4000-8000-000000013019',
    categoryId: categories[2].id,
    name: 'Chopoli',
    description:
      'Chilaquiles en salsa de chile morita y chapulines, acompañados de costilla de res braseada al Josper.',
    priceCents: 33500,
    sortOrder: 5,
  },
  {
    id: '00000000-0000-4000-8000-000000013020',
    categoryId: categories[3].id,
    name: 'Mikela',
    description:
      'Orden de lengua de res a fuego lento en salsa de tomatillo milpero, con sopes de tortilla de maíz azul, requesón de Tecate y frijoles negros refritos.',
    priceCents: 30500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013021',
    categoryId: categories[3].id,
    name: 'Coyoltzin',
    description:
      'Puntas de filete de res en salsa criolla de jitomate y cebolla, con nopales tiernos y queso panela de Castilla.',
    priceCents: 29000,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013022',
    categoryId: categories[3].id,
    name: 'Moli',
    description:
      'Estofado de marlín ahumado con pimientos y aceitunas, dos huevos estrellados y crema de chile chipotle.',
    priceCents: 29000,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013023',
    categoryId: categories[3].id,
    name: 'Barbacoa de borrego tatemado',
    description:
      'Borrego marinado durante dos días y horneado lentamente por ocho horas, ligeramente tatemado.',
    priceCents: 41500,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013024',
    categoryId: categories[4].id,
    name: 'Xiomatl',
    description:
      'Entomatadas de tortilla rellenas de frijol negro, cubiertas con cecina ahumada en leña de encino y salsa sofrita de jitomate.',
    priceCents: 29900,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013025',
    categoryId: categories[4].id,
    name: 'Tlayudas',
    description:
      'Preparación estilo Marenca de Oaxaca, con asientos de cerdo, frijol negro, tasajo, quesillo y complementos tradicionales.',
    priceCents: 29000,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013026',
    categoryId: categories[4].id,
    name: 'Ayautli',
    description:
      'Huevos de la casa con cecina de Yecapixtla o arrachera, dos huevos al gusto, salsa a elegir y chilaquiles en salsa roja.',
    priceCents: 38500,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013027',
    categoryId: categories[4].id,
    name: 'Ensalada de fruta',
    description:
      'Selección de fruta de temporada, acompañada de yogurt natural, miel y granos diversos.',
    priceCents: 23500,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013028',
    categoryId: categories[5].id,
    name: 'Energético',
    description: 'Jugo natural de zanahoria, apio, perejil y espinaca. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013029',
    categoryId: categories[5].id,
    name: 'Nutritivo',
    description: 'Jugo natural de zanahoria, tomate y apio. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013030',
    categoryId: categories[5].id,
    name: 'De la casa',
    description: 'Jugo natural de zanahoria, betabel y nopal. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 2,
  },
  {
    id: '00000000-0000-4000-8000-000000013031',
    categoryId: categories[5].id,
    name: 'Verde',
    description: 'Jugo natural de naranja, apio, perejil, piña y nopal. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 3,
  },
  {
    id: '00000000-0000-4000-8000-000000013032',
    categoryId: categories[5].id,
    name: 'Digestivo',
    description: 'Jugo natural de zanahoria, manzana y gotas de limón. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 4,
  },
  {
    id: '00000000-0000-4000-8000-000000013033',
    categoryId: categories[5].id,
    name: 'Depurativo',
    description: 'Jugo natural de naranja, papaya y melón. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 5,
  },
  {
    id: '00000000-0000-4000-8000-000000013034',
    categoryId: categories[5].id,
    name: 'Vitamínico',
    description: 'Jugo natural de zanahoria, apio, naranja y piña. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 6,
  },
  {
    id: '00000000-0000-4000-8000-000000013035',
    categoryId: categories[5].id,
    name: 'Diurético',
    description: 'Jugo natural de betabel, apio, naranja y piña. Precio chico; grande $95.',
    priceCents: 8500,
    sortOrder: 7,
  },
  {
    id: '00000000-0000-4000-8000-000000013036',
    categoryId: categories[6].id,
    name: 'Café americano',
    description: null,
    priceCents: 8500,
    sortOrder: 0,
  },
  {
    id: '00000000-0000-4000-8000-000000013037',
    categoryId: categories[6].id,
    name: 'Café de olla',
    description: null,
    priceCents: 9500,
    sortOrder: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000013038',
    categoryId: categories[6].id,
    name: 'Atole de nuez',
    description: null,
    priceCents: 9000,
    sortOrder: 2,
  },
] as const;

const items = rawItems.map((item) => ({
  ...item,
  id: scopedDataId(item.id),
}));

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
        tenantSlug,
        tenantName,
        null,
        tenantWhatsappPhone,
        null,
        '#9E3F2A',
        'cocina mexicana contemporánea',
        'es',
        'MXN',
        tenantPlan,
      ],
    );

    for (const section of sections) {
      await client.query(
        `
          INSERT INTO menu_sections (
            id,
            tenant_id,
            name,
            cover_image_url,
            accent_color,
            sort_order,
            is_visible,
            deleted_at
          )
          VALUES ($1, $2, $3, NULL, $4, $5, $6, NULL)
          ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            name = EXCLUDED.name,
            cover_image_url = EXCLUDED.cover_image_url,
            accent_color = EXCLUDED.accent_color,
            sort_order = EXCLUDED.sort_order,
            is_visible = EXCLUDED.is_visible,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          section.id,
          tenantId,
          section.name,
          section.accentColor,
          section.sortOrder,
          section.isVisible,
        ],
      );
    }

    for (const category of categories) {
      await client.query(
        `
          INSERT INTO categories (
            id,
            tenant_id,
            section_id,
            name,
            sort_order,
            is_visible,
            deleted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NULL)
          ON CONFLICT (tenant_id, name) DO UPDATE SET
            section_id = EXCLUDED.section_id,
            sort_order = EXCLUDED.sort_order,
            is_visible = EXCLUDED.is_visible,
            deleted_at = NULL,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          category.id,
          tenantId,
          category.sectionId,
          category.name,
          category.sortOrder,
          category.isVisible,
        ],
      );
    }

    for (const item of items) {
      await client.query(
        `
          INSERT INTO menu_items (
            id,
            tenant_id,
            category_id,
            name,
            description,
            price_cents,
            is_special_today,
            special_price,
            currency,
            image_url,
            is_available,
            sort_order,
            deleted_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, false, NULL, 'MXN', NULL, true, $7, NULL)
          ON CONFLICT (id) DO UPDATE SET
            tenant_id = EXCLUDED.tenant_id,
            category_id = EXCLUDED.category_id,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            price_cents = EXCLUDED.price_cents,
            is_special_today = EXCLUDED.is_special_today,
            special_price = EXCLUDED.special_price,
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
          item.sortOrder,
        ],
      );
    }

    await client.query(
      `
        UPDATE menu_items
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1
          AND deleted_at IS NULL
          AND id <> ALL($2::uuid[])
      `,
      [tenantId, items.map((item) => item.id)],
    );

    await client.query(
      `
        UPDATE categories
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1
          AND deleted_at IS NULL
          AND id <> ALL($2::uuid[])
      `,
      [tenantId, categories.map((category) => category.id)],
    );

    await client.query(
      `
        UPDATE menu_sections
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1
          AND deleted_at IS NULL
          AND id <> ALL($2::uuid[])
      `,
      [tenantId, sections.map((section) => section.id)],
    );

    await client.query('COMMIT');
    const counts = await client.query<{
      sections: string;
      categories: string;
      items: string;
    }>(
      `
        SELECT
          (SELECT COUNT(*) FROM menu_sections WHERE tenant_id = $1 AND deleted_at IS NULL)::text AS sections,
          (SELECT COUNT(*) FROM categories WHERE tenant_id = $1 AND deleted_at IS NULL)::text AS categories,
          (SELECT COUNT(*) FROM menu_items WHERE tenant_id = $1 AND deleted_at IS NULL)::text AS items
      `,
      [tenantId],
    );

    console.log(
      `Seeded Marenca with ${sections.length} sections, ${categories.length} categories and ${items.length} items.`,
    );
    console.log(
      `Verified database rows: ${counts.rows[0].sections} sections, ${counts.rows[0].categories} categories and ${counts.rows[0].items} items.`,
    );
    console.log(`Public slug: ${tenantSlug}`);
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
