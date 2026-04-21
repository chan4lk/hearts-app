#!/usr/bin/env bash
# Daily Postgres backup with retention pruning.
#
# Deploy on the DB host or a jump box with network access. Schedule via cron:
#   0 2 * * * postgres /opt/aspirehub/scripts/backup-db.sh >> /var/log/aspirehub-backup.log 2>&1
#
# Env required: DATABASE_URL — the same connection string the app uses.
# Env optional: BACKUP_DIR (default /var/backups/aspirehub), RETENTION_DAYS (default 14)
#
# For off-site durability, add an `azcopy sync` or `aws s3 sync` after pg_dump
# and alert on non-zero exit — an on-host backup alone is not a backup.

set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/aspirehub}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TS="$(date +%F-%H%M)"
OUT="$BACKUP_DIR/aspirehub-$TS.dump"

mkdir -p "$BACKUP_DIR"

echo "[$(date -Iseconds)] backup start -> $OUT"
pg_dump --format=custom --file="$OUT" "$DATABASE_URL"
echo "[$(date -Iseconds)] backup ok  ($(du -h "$OUT" | cut -f1))"

# Prune anything older than the retention window
PRUNED=$(find "$BACKUP_DIR" -name 'aspirehub-*.dump' -mtime "+$RETENTION_DAYS" -print -delete | wc -l || true)
echo "[$(date -Iseconds)] pruned    $PRUNED file(s) older than $RETENTION_DAYS days"

# Optional off-site sync — uncomment ONE and configure credentials
# azcopy sync "$BACKUP_DIR" "https://<account>.blob.core.windows.net/aspirehub-backups" --delete-destination=true
# aws s3 sync "$BACKUP_DIR" "s3://aspirehub-backups/" --delete
