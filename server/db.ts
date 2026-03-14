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
