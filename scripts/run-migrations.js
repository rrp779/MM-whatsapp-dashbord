/**
 * Migration runner for Supabase database migrations.
 *
 * Reads SQL files from supabase/migrations/ in filename order, connects to
 * the database using DATABASE_URL from the environment, and runs any migrations
 * that have not been applied yet. Applied migrations are tracked in a
 * schema_migrations table.
 *
 * Usage: npm run migrate
 * Requires: DATABASE_URL in .env (Supabase → Project Settings → Database → Connection string)
 */

import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'supabase', 'migrations');
/** Use schema-qualified name so migrations that set search_path = '' don't break our queries. */
const TRACKING_TABLE = 'public.schema_migrations';

/**
 * Loads DATABASE_URL from environment and exits with an error if missing.
 * @returns {string} The database connection string.
 */
function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === '') {
    console.error(
      'Missing DATABASE_URL. Add it to your .env file.\n' +
        'Get it from: Supabase Dashboard → Project Settings → Database → Connection string (URI).'
    );
    process.exit(1);
  }
  return url.trim();
}

/**
 * Creates the migrations tracking table if it does not exist.
 * @param {pg.Client} client - PostgreSQL client.
 * @returns {Promise<void>}
 */
async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TRACKING_TABLE} (
      name text PRIMARY KEY,
      run_at timestamptz DEFAULT now()
    )
  `);
}

/**
 * Returns the list of migration names that have already been applied.
 * @param {pg.Client} client - PostgreSQL client.
 * @returns {Promise<string[]>}
 */
async function getAppliedMigrations(client) {
  const res = await client.query(
    `SELECT name FROM ${TRACKING_TABLE} ORDER BY name`
  );
  return res.rows.map((r) => r.name);
}

/**
 * Reads migration SQL files from supabase/migrations/, sorted by filename.
 * @returns {Promise<Array<{ name: string, sql: string }>>}
 */
async function loadMigrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort();

  const migrations = [];
  for (const name of files) {
    const path = join(MIGRATIONS_DIR, name);
    const sql = await readFile(path, 'utf8');
    migrations.push({ name, sql: sql.trim() });
  }
  return migrations;
}

/**
 * Runs a single migration and records it in the tracking table.
 * @param {pg.Client} client - PostgreSQL client.
 * @param {{ name: string, sql: string }} migration - Migration name and SQL.
 * @returns {Promise<void>}
 */
async function runMigration(client, migration) {
  const { name, sql } = migration;
  if (sql === '') {
    await client.query(
      `INSERT INTO ${TRACKING_TABLE} (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
    return;
  }
  await client.query(sql);
  await client.query(
    `INSERT INTO ${TRACKING_TABLE} (name) VALUES ($1)`,
    [name]
  );
}

/**
 * Main entry: connect, run pending migrations, then exit.
 * @returns {Promise<void>}
 */
async function main() {
  const databaseUrl = getDatabaseUrl();

  const client = new pg.Client({ connectionString: databaseUrl });
  try {
    await client.connect();
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    process.exit(1);
  }

  try {
    await ensureTrackingTable(client);
    const applied = await getAppliedMigrations(client);
    const migrations = await loadMigrationFiles();

    let runCount = 0;
    for (const m of migrations) {
      if (applied.includes(m.name)) {
        continue;
      }
      process.stdout.write(`Running ${m.name}... `);
      await runMigration(client, m);
      runCount += 1;
      console.log('done.');
    }

    if (runCount === 0) {
      console.log('No new migrations to run.');
    } else {
      console.log(`Applied ${runCount} migration(s).`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
