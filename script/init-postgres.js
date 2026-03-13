import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.argv[2];

if (!databaseUrl) {
  console.error('Usage: node script/init-postgres.js <DATABASE_URL>');
  console.error('Example: node script/init-postgres.js "postgresql://user:pass@host/db"');
  process.exit(1);
}

async function initDatabase() {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Read the migration SQL
    const sqlPath = path.join(__dirname, '..', 'db', 'migrations', 'postgres_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Running migration...');
    await client.query(sql);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDatabase();
