# Production database migration guide

## 1. Fix Prisma engine download (ECONNREFUSED / network error)

If `prisma migrate dev` or `prisma generate` fails with a network error when downloading the schema engine:

### Option A: Use a working network and run once

- Run `npx prisma generate` (or `prisma migrate dev`) from a machine/network that can reach `binaries.prisma.sh`.
- Commit the generated client and, if you use migrations, the new migration files. Deploy that commit; on the server you only run `prisma migrate deploy` (which uses the migration SQL, not a fresh engine download in the same way).

### Option B: Point to a custom engine (advanced)

- Set `PRISMA_QUERY_ENGINE_LIBRARY` to the path of a pre-downloaded query engine binary for your platform.
- Pre-download the engine from a machine with internet, then copy it to the production/offline environment.

### Option C: Proxy / firewall

- If behind a proxy or firewall, ensure the machine can reach `https://binaries.prisma.sh` (or configure HTTP_PROXY/HTTPS_PROXY if Prisma respects it for the download).

---

## 2. Update production DB without data loss

Migrations in `prisma/migrations/` are applied with:

```bash
npx prisma migrate deploy
```

This runs only **pending** migration SQL files against `DATABASE_URL` and does **not** drop data when the migration is additive (new columns, new enum values).

### Manual run (if Prisma CLI cannot reach the engine)

If you cannot run `prisma migrate deploy` on the server (e.g. engine download fails), you can apply the same SQL by hand:

1. **Back up the database** (e.g. `pg_dump` or your provider’s backup).

2. **Run the migration SQL** against the production DB:

   - For the migration that adds event category and participation roles, run the contents of:
     - `prisma/migrations/20260208000000_add_event_category_and_participation_roles/migration.sql`

   Example with `psql`:

   ```bash
   psql "$DATABASE_URL" -f prisma/migrations/20260208000000_add_event_category_and_participation_roles/migration.sql
   ```

   Or paste the SQL into your DB provider’s SQL console (e.g. Supabase, RDS, etc.).

3. **Mark the migration as applied** (so Prisma doesn’t try to run it again):

   ```bash
   npx prisma migrate resolve --applied 20260208000000_add_event_category_and_participation_roles
   ```

   Use this only after the SQL has been applied successfully. If you prefer not to use the CLI, you can insert the migration record into `_prisma_migrations` yourself (same as `migrate resolve --applied`).

4. **Regenerate Prisma Client** where you build the app (e.g. CI or your machine with network):

   ```bash
   npx prisma generate
   ```

   Then deploy the app so it uses the updated client with the new columns and enum.

### Safe, additive changes in this migration

- New enum value: `EventType.RBT_TRAINING`
- New nullable columns: `Event.categoryLabel`, `EventParticipation.toastmasterRole`, `EventParticipation.heartsTalkRole`  
No existing data is removed or overwritten.
