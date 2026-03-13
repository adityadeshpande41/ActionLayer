import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import Database from "better-sqlite3";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Use PostgreSQL in production, SQLite in development
const isProduction = process.env.NODE_ENV === "production";
const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePostgres>;

if (isProduction && databaseUrl?.startsWith("postgres")) {
  // PostgreSQL for production
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL !== "false" ? { rejectUnauthorized: false } : false,
  });
  db = drizzlePostgres(pool, { schema });
  console.log("[Database] Connected to PostgreSQL");
} else {
  // SQLite for development
  const sqlite = new Database(databaseUrl || "sqlite.db");
  db = drizzleSqlite(sqlite, { schema });
  console.log("[Database] Connected to SQLite");
}

export { db };
