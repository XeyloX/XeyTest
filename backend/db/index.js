import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool, Client } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString });

export const query = (text, params = []) => pool.query(text, params);

async function ensureDatabaseExists() {
  const url = new URL(connectionString);
  const dbName = url.pathname.replace(/^\//, '');
  const adminUrl = new URL(connectionString);
  adminUrl.pathname = '/postgres';

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();

  const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  }

  await client.end();
}

export async function initDb() {
  await ensureDatabaseExists();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

export async function closeDb() {
  await pool.end();
}
