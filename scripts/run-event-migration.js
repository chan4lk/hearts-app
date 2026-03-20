/**
 * Run event migration SQL against the current database (no Prisma engine download).
 * Usage: npm run db:migrate   OR   node scripts/run-event-migration.js
 * Requires: DATABASE_URL in .env or in environment (e.g. set DATABASE_URL=... on Windows).
 */
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

// Load .env then .env.local (same order as Next.js; .env.local overrides)
function loadEnv(file) {
  const p = path.join(root, file);
  try {
    const content = fs.readFileSync(p, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    });
  } catch (_) {}
}
loadEnv('.env');
loadEnv('.env.local');

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it in .env or .env.local');
  process.exit(1);
}

// Base event schema migration (creates EventType enum, Event, EventParticipation tables)
const baseMigrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260205000000_add_event_management',
  'migration.sql'
);

const baseSql = fs.readFileSync(baseMigrationPath, 'utf8');

// Split base migration into single statements (Prisma runs one command per call)
function splitSqlStatements(sql) {
  return sql
    .split(/;\s*\n/)
    .map((s) => s.replace(/^\s*--[^\n]*\n/gm, '').trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith(';') ? s : s + ';'));
}

const baseStatements = splitSqlStatements(baseSql);

// Add categoryLabel + participation role fields + RBT_TRAINING enum value
const migrationPath = path.join(
  __dirname,
  '..',
  'prisma',
  'migrations',
  '20260208000000_add_event_category_and_participation_roles',
  'migration.sql'
);

const fullSql = fs.readFileSync(migrationPath, 'utf8');

// Run each statement separately for compatibility
const doBlock = fullSql.match(/DO \$\$[\s\S]*?\$\$;/)?.[0];
const statements = [
  doBlock,
  'ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "categoryLabel" TEXT;',
  'ALTER TABLE "EventParticipation" ADD COLUMN IF NOT EXISTS "toastmasterRole" TEXT;',
  'ALTER TABLE "EventParticipation" ADD COLUMN IF NOT EXISTS "heartsTalkRole" TEXT;',
].filter(Boolean);

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    // First, ensure base event schema exists (run each statement; skip if already exists)
    console.log('Applying base event schema migration (if needed)...');
    for (const sql of baseStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        const msg = String(e?.message || e);
        if (msg.includes('already exists') || msg.includes('duplicate key')) {
          // Object exists, skip
          continue;
        }
        console.error('Base migration statement failed:', msg);
        process.exit(1);
      }
    }

    // Then apply additive changes (enum value + new columns)
    for (const sql of statements) {
      if (sql) await prisma.$executeRawUnsafe(sql);
    }
    console.log('Migration applied successfully.');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
