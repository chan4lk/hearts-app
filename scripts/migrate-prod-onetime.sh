#!/bin/bash
# =============================================================================
# One-Time Production Migration Script
# =============================================================================
# This script transitions the production database from "db push" state to
# proper Prisma migration tracking. Run this ONCE during the first deployment
# that includes the performance review lifecycle features.
#
# After this script runs successfully, all future deployments only need:
#   npx prisma migrate deploy
#
# Prerequisites:
#   - DATABASE_URL environment variable set to the production database
#   - npx/prisma CLI available
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/dbname" ./scripts/migrate-prod-onetime.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Pre-flight checks ---
echo "============================================="
echo "  One-Time Production Migration Script"
echo "============================================="
echo ""

if [ -z "${DATABASE_URL:-}" ]; then
  error "DATABASE_URL environment variable is not set.\nUsage: DATABASE_URL=\"postgresql://...\" $0"
fi

# Mask password in output
SAFE_URL=$(echo "$DATABASE_URL" | sed 's|://[^:]*:[^@]*@|://****:****@|')
echo "Target database: $SAFE_URL"
echo ""

# Confirm before proceeding
read -p "This will modify the production database schema. Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""

# --- Step 1: Baseline existing migrations ---
echo "--- Step 1/3: Baseline existing migrations ---"

EXISTING_MIGRATIONS=(
  "20250408092204_add_notifications"
  "20250410024224_update_feedback_model"
  "20250410044946_add_user_activity_fields"
  "20250410060836_add_system_settings"
  "20250620173158_fix_goal_relation"
)

for migration in "${EXISTING_MIGRATIONS[@]}"; do
  echo -n "  Marking $migration as applied... "
  if npx prisma migrate resolve --applied "$migration" 2>/dev/null; then
    echo "done"
  else
    warn "Failed or already marked: $migration (continuing)"
  fi
done

log "Existing migrations baselined"
echo ""

# --- Step 2: Generate and apply schema diff ---
echo "--- Step 2/3: Apply schema diff for new migration ---"

DIFF_FILE="/tmp/prisma-diff-$$.sql"

echo "  Generating diff between current DB and target schema..."
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script 2>/dev/null > "$DIFF_FILE"

DIFF_LINES=$(wc -l < "$DIFF_FILE" | tr -d ' ')

if [ "$DIFF_LINES" -eq 0 ]; then
  log "No schema changes needed - database already matches target schema"
else
  echo "  Generated $DIFF_LINES lines of SQL"
  echo "  Applying schema changes..."

  npx prisma db execute --url "$DATABASE_URL" --file "$DIFF_FILE" 2>/dev/null

  if [ $? -eq 0 ]; then
    log "Schema diff applied successfully"
  else
    rm -f "$DIFF_FILE"
    error "Failed to apply schema diff. Check the output above."
  fi
fi

rm -f "$DIFF_FILE"
echo ""

# --- Step 3: Mark new migration as applied ---
echo "--- Step 3/3: Mark new migration as applied ---"

NEW_MIGRATION="20260301072600_add_feedback_meetings_surveys_exit_interviews"

echo -n "  Marking $NEW_MIGRATION as applied... "
npx prisma migrate resolve --applied "$NEW_MIGRATION" 2>/dev/null
log "New migration marked as applied"
echo ""

# --- Verify ---
echo "--- Verification ---"
npx prisma migrate status 2>&1 | grep -E "migrations found|up to date|failed"
echo ""

echo "============================================="
echo -e "  ${GREEN}Migration complete!${NC}"
echo ""
echo "  All future deployments only need:"
echo "    npx prisma migrate deploy"
echo "============================================="
