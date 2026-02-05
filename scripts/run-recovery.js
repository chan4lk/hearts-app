#!/usr/bin/env node

/**
 * Hearts App - Database Recovery Script (Node.js)
 * This script executes the database recovery directly via PostgreSQL connection
 * Usage: node scripts/run-recovery.js
 */

const fs = require('fs');
const path = require('path');

// Try to load environment variables from .env
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, that's okay
}

// Get database connection parameters
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5434/performance_management';

console.log('\n================================================');
console.log('Hearts App - Database Recovery');
console.log('================================================\n');

// Parse DATABASE_URL
const url = new URL(DATABASE_URL);
const dbConfig = {
  user: url.username,
  password: url.password,
  host: url.hostname,
  port: url.port,
  database: url.pathname.slice(1),
};

console.log(`Connecting to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log('');

// Try to load pg module
let pg;
try {
  pg = require('pg');
} catch (e) {
  console.error('ERROR: pg (postgres driver) is not installed');
  console.error('');
  console.error('Install it with: npm install pg');
  process.exit(1);
}

// Read the SQL recovery script
const sqlFilePath = path.join(__dirname, 'fix-migrations.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`ERROR: fix-migrations.sql not found at ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
console.log(`Loaded recovery script: ${sqlFilePath} (${sqlContent.length} bytes)\n`);

// Create a new client
const client = new pg.Client(dbConfig);

(async () => {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connection successful\n');

    console.log('Executing recovery script...');
    console.log('This may take a moment...\n');

    // Execute the SQL script
    await client.query(sqlContent);

    console.log('\n================================================');
    console.log('✓ Database recovery completed successfully!');
    console.log('================================================\n');

    console.log('Next steps:');
    console.log('1. Run: npm run prisma:generate');
    console.log('2. Run: npm run prisma:seed (optional)');
    console.log('3. Run: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n================================================');
    console.error('✗ Database recovery failed');
    console.error('================================================\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused - make sure:');
      console.error('1. PostgreSQL is running on localhost:5434');
      console.error('2. Docker container is started: docker-compose up -d');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
})();
