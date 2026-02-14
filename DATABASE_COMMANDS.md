# Database Commands Quick Reference

## NPM Scripts

```bash
# Generate migration after schema changes
npm run db:generate

# Run migrations (apply schema to database)
npm run db:migrate

# Push schema directly (no migration files)
npm run db:push

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

## Direct Commands

```bash
# View database with SQLite CLI
sqlite3 sqlite.db

# Backup database
cp sqlite.db backup.db

# Reset database (delete and recreate)
rm sqlite.db && npm run db:migrate

# Check database size
ls -lh sqlite.db
```

## SQLite CLI Commands

```sql
-- List all tables
.tables

-- Show table schema
.schema users

-- View all users
SELECT * FROM users;

-- Count records
SELECT COUNT(*) FROM analyses;

-- Recent analyses
SELECT id, inputType, status, createdAt 
FROM analyses 
ORDER BY createdAt DESC 
LIMIT 10;

-- Exit
.quit
```

## Drizzle Studio

Visual database browser with GUI:

```bash
npm run db:studio
```

Opens at `https://local.drizzle.studio`

Features:
- Browse all tables
- View/edit data
- Run queries
- See relationships
- Export data

## Common Tasks

### Add a new table

1. Edit `shared/schema.ts`
2. Add new table definition
3. Generate migration: `npm run db:generate`
4. Run migration: `npm run db:migrate`
5. Restart server

### Modify existing table

1. Edit table in `shared/schema.ts`
2. Generate migration: `npm run db:generate`
3. Review migration in `migrations/` folder
4. Run migration: `npm run db:migrate`
5. Restart server

### Reset everything

```bash
rm sqlite.db
npm run db:migrate
npm run dev
```

### Backup before changes

```bash
cp sqlite.db "backup_$(date +%Y%m%d_%H%M%S).db"
```
