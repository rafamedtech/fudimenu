import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  try {
    const res = await client.query("SELECT migration_name FROM _prisma_migrations");
    console.log("Migrations applied:");
    res.rows.forEach(r => console.log(r.migration_name));
  } catch (e) {
    console.error(e.message);
  }
  await client.end();
}
run();
