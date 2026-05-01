import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_URL,
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT COUNT(*) FROM menu_items");
  console.log("Count in menu_items:", res.rows[0].count);
  await client.end();
}
run();
