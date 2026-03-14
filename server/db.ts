import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Use PostgreSQL in production, SQLite in development
const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;
export const isPostgres = isProduction && databaseUrl?.startsWith("postgres");

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePostgres>;

if (isPostgres) {
  // PostgreSQL for production
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL !== "false" ? { rejectUnauthorized: false } : false,
  });
  db = drizzlePostgres(pool, { schema });
  console.log("[Database] Connected to PostgreSQL");

  // Run safe migrations for new columns
  pool.query(`
    ALTER TABLE analyses ADD COLUMN IF NOT EXISTS name TEXT;
  `).then(() => {
    console.log("[Database] Migration: analyses.name column ensured");
  }).catch((err: any) => {
    console.error("[Database] Migration error:", err.message);
  });

  // Backfill null/zero timestamps on existing rows - run each separately (pg doesn't support multi-statement queries)
  const backfillQueries = [
    `UPDATE analyses SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE risks SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE risks SET last_seen = NOW() WHERE last_seen IS NULL OR last_seen < '2020-01-01'`,
    `UPDATE decisions SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE action_items SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE transcripts SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE projects SET created_at = NOW() WHERE created_at IS NULL OR created_at < '2020-01-01'`,
    `UPDATE projects SET updated_at = NOW() WHERE updated_at IS NULL OR updated_at < '2020-01-01'`,
  ];
  Promise.all(backfillQueries.map(q => pool.query(q)))
    .then(() => console.log("[Database] Backfill: timestamps fixed"))
    .catch((err: any) => console.error("[Database] Backfill error:", err.message));
} else {
  // SQLite for development
  const sqlite = new Database(databaseUrl || "sqlite.db");
  db = drizzleSqlite(sqlite, { schema });
  console.log("[Database] Connected to SQLite");

  // Run safe migrations for SQLite
  try {
    sqlite.exec(`ALTER TABLE analyses ADD COLUMN name TEXT;`);
    console.log("[Database] Migration: analyses.name column added to SQLite");
  } catch {
    // Column already exists, ignore
  }
}

export { db };
