import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  
  const tables = [
    'menu_items'
  ];

  for (const table of tables) {
    try {
      console.log(`Adding deleted_at to ${table}...`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;`);
      
      // also create index if possible
      try {
        await client.query(`CREATE INDEX IF NOT EXISTS ${table}_deleted_at_idx ON ${table}(deleted_at);`);
        console.log(`Created index on ${table}(deleted_at)`);
      } catch (e) {
        console.log(`Could not create index on ${table}:`, e.message);
      }
      
    } catch (err) {
      console.error(`Error on ${table}:`, err.message);
    }
  }

  await client.end();
}

run();
