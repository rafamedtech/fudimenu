process.env.SEED_MARENCA_TENANT_ID = '00000000-0000-4000-8000-000000000001';
process.env.SEED_MARENCA_TENANT_SLUG = 'taqueria-don-pepe';
process.env.SEED_MARENCA_TENANT_NAME = 'Marenca';
process.env.SEED_MARENCA_TENANT_PLAN = 'free';
process.env.SEED_MARENCA_WHATSAPP_PHONE = '+525512345678';
process.env.SEED_MARENCA_DATA_ID_NAMESPACE = '00000000';

const seedModulePath = './seed-marenca.ts';
await import(seedModulePath);

export {};
