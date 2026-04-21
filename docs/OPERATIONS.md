# Bistec AspireHub — Operations Guide

Runbook for production hosts. Everything here assumes a Linux VM or container
platform with `pg_dump`, `node`, and outbound HTTPS available.

---

## 1. Database backup

Use a daily `pg_dump` with 14-day retention. For managed Postgres (Azure DB
for PostgreSQL, Supabase, Neon), prefer the provider's point-in-time-restore
— this script is only a safety net for self-hosted.

Run as a cron job on the DB host or a jump box:

```bash
# /etc/cron.d/aspirehub-db-backup
0 2 * * *  postgres  /opt/aspirehub/scripts/backup-db.sh >> /var/log/aspirehub-backup.log 2>&1
```

Minimal backup script (`scripts/backup-db.sh`):

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/aspirehub}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TS="$(date +%F-%H%M)"
mkdir -p "$BACKUP_DIR"

pg_dump --format=custom --file="$BACKUP_DIR/aspirehub-$TS.dump" "$DATABASE_URL"

# Prune anything older than retention window
find "$BACKUP_DIR" -name 'aspirehub-*.dump' -mtime +$RETENTION_DAYS -delete

echo "[$(date -Iseconds)] backup ok: aspirehub-$TS.dump"
```

Restore (one dump → fresh DB):

```bash
createdb aspirehub_restore
pg_restore --clean --if-exists --dbname aspirehub_restore aspirehub-2026-04-21-0200.dump
```

**Off-site copy:** after each backup, sync the folder to Azure Blob / S3.
A missed off-site copy is the backup failing silently. Configure a simple
`azcopy sync` or `aws s3 sync` in the same cron job and alert on non-zero exit.

---

## 2. Azure Application Insights

Optional but strongly recommended in production.

1. Create an Application Insights resource in the Azure portal.
2. Copy the **Connection string** (not the instrumentation key).
3. Set in prod env:

   ```
   APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=https://...
   ```

4. Restart the app. `lib/logger.ts` auto-detects and routes `logger.error`,
   `logger.warn`, `logger.event` to App Insights. Without the env var, logs
   go to stdout as structured JSON (still parseable by any log aggregator).

No code changes needed — the wiring is already in place.

---

## 3. Horizontal scaling & rate limiting

The default rate limiter is in-memory per-process. It's correct for a single
Next.js instance but drifts across instances behind a load balancer.

To scale out:

```bash
npm i @upstash/redis      # or: npm i ioredis
```

Then edit `lib/rateLimit.ts` → `makeRedisStore()` to implement `hit()` as
`INCR` + `EXPIRE` against Redis. Set:

```
RATELIMIT_STORE=redis
REDIS_URL=redis://default:password@host:6379
```

Every call site (hearts POST, goals bulk create, etc.) already uses
`checkRateLimit()` and will transparently pick up the Redis store.

---

## 4. Secret rotation

- `NEXTAUTH_SECRET` + `JWT_SECRET` — run `node scripts/rotate-local-secrets.js`
  locally; in prod, set new values in env and restart. Existing sessions are
  invalidated (users must sign in again).
- `AZURE_AD_CLIENT_SECRET` — rotate in Azure Portal → App Registrations →
  Certificates & secrets → New client secret. Update env, restart.
- Database credentials — rotate in the Postgres provider, update
  `DATABASE_URL`, restart.

Never commit `.env*` files. The `.gitignore` catches these; if you ever
accidentally commit a secret, rotate first, then `git filter-repo` the file
out of history.

---

## 5. Health checks

- `GET /api/health` — liveness probe (returns 200 if the process is up).
- `GET /api/health/db` — readiness (runs a `SELECT 1` against Postgres).

Point your load balancer / Kubernetes probe at `/api/health/db`.

---

## 6. Deployment checklist

Before cutting a release:

- [ ] `npm run build:clean` succeeds with no warnings
- [ ] `npm test` green (Vitest suite)
- [ ] Env vars set: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`,
      `AZURE_AD_*`, optionally `APPLICATIONINSIGHTS_CONNECTION_STRING`
- [ ] Run migrations: `npm run prisma:migrate:deploy`
- [ ] DB backup cron job scheduled and verified with a test restore
- [ ] Health endpoints reachable from the LB
- [ ] App Insights receiving events (check Live Metrics after a few requests)
