/**
 * Rotate local-only secrets (NEXTAUTH_SECRET + JWT_SECRET) in .env.local.
 *
 * Safe to re-run. Does NOT touch AZURE_AD_* / OPENAI_API_KEY / DATABASE_URL.
 * Those require provider-side rotation (Azure Portal, OpenAI dashboard).
 *
 *   Run:   node scripts/rotate-local-secrets.js
 */
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '..', '.env.local');

const ROTATE = {
  NEXTAUTH_SECRET: () => crypto.randomBytes(32).toString('base64'),
  JWT_SECRET: () => crypto.randomBytes(48).toString('base64'),
};

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('No .env.local found at', ENV_PATH);
    process.exit(1);
  }
  const original = fs.readFileSync(ENV_PATH, 'utf8');
  let out = original;
  const changes = [];

  for (const [key, gen] of Object.entries(ROTATE)) {
    const value = gen();
    const re = new RegExp(`^${key}=.*$`, 'm');
    if (re.test(out)) {
      out = out.replace(re, `${key}=${value}`);
      changes.push(`  ~ ${key} rotated`);
    } else {
      out += `\n${key}=${value}`;
      changes.push(`  + ${key} added`);
    }
  }

  // Back up the original once
  const backup = ENV_PATH + '.bak-' + Date.now();
  fs.writeFileSync(backup, original);
  fs.writeFileSync(ENV_PATH, out);

  console.log('Rotated local secrets in', ENV_PATH);
  changes.forEach((l) => console.log(l));
  console.log('Backup saved at', backup);
  console.log('\n⚠️  Restart the dev server for new secrets to take effect.');
}

main();
