#!/usr/bin/env node
/**
 * One-shot migration: convert Next.js 14 sync dynamic-route params to the
 * Next.js 15+ async signature.
 *
 *   Before: { params }: { params: { goalId: string } }
 *           params.goalId
 *
 *   After:  { params }: { params: Promise<{ goalId: string }> }
 *           (await params).goalId   — or destructure once at the top
 *
 * We take the simpler approach: rewrite `params.KEY` to `(await params).KEY`.
 * The tsc pass after this migration catches any case we missed.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');

// Find all route.ts files under app/ that use the sync params pattern
const files = execSync(
  'git ls-files "app/**/route.ts"',
  { cwd: root, encoding: 'utf8' }
).split('\n').filter(Boolean);

let touched = 0;
for (const rel of files) {
  const abs = path.join(root, rel);
  const src = fs.readFileSync(abs, 'utf8');

  // Match the sync params type: `params: { foo: string; bar: string }`
  // Rewrite to `params: Promise<{ foo: string; bar: string }>`
  let next = src.replace(
    /params:\s*(\{\s*[^}]+?\s*\})\s*\}/g,
    (match, innerType) => `params: Promise<${innerType}> }`
  );

  if (next === src) continue;

  // Every `params.foo` reference needs to become `(await params).foo`.
  // We also need the enclosing function to be `async` (already true for
  // GET/POST/PATCH/DELETE/PUT export async function ...).
  next = next.replace(
    /\bparams\.([A-Za-z_][A-Za-z0-9_]*)/g,
    '(await params).$1'
  );

  // Protect existing `await params` from double-wrapping by this script.
  // (not strictly needed on a fresh run but safe.)
  next = next.replace(/\(await \(await params\)\)/g, '(await params)');

  if (next !== src) {
    fs.writeFileSync(abs, next, 'utf8');
    touched++;
    console.log(`migrated: ${rel}`);
  }
}

console.log(`\n✅ migrated ${touched} file(s)`);
