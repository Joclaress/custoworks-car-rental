/**
 * Development helper: starts a local PostgreSQL server WITHOUT installing
 * PostgreSQL system-wide (uses the `embedded-postgres` npm package).
 *
 *   npm run db:embedded      (keep this terminal open)
 *
 * Connection: postgresql://postgres:postgres@localhost:5433/custoworks
 * For production use a real PostgreSQL 14+ server.
 */
import EmbeddedPostgres from 'embedded-postgres';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), '.pgdata');
const firstRun = !fs.existsSync(path.join(dataDir, 'PG_VERSION'));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 5433,
  persistent: true,
});

async function main() {
  if (firstRun) await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase('custoworks');
  } catch {
    /* already exists */
  }
  console.log('✅ Embedded PostgreSQL running on postgresql://postgres:postgres@localhost:5433/custoworks');
  const stop = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

