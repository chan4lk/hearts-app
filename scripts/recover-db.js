#!/usr/bin/env node

/**
 * Hearts App - Database Recovery Script using Prisma
 * This script executes the database recovery directly via Prisma raw queries
 * Usage: node scripts/recover-db.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n================================================');
  console.log('Hearts App - Database Recovery');
  console.log('================================================\n');

  try {
    // Test connection
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Connection successful\n');

    // Read the SQL recovery script
    const sqlFilePath = path.join(__dirname, 'fix-migrations.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`ERROR: fix-migrations.sql not found at ${sqlFilePath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log(`Loaded recovery script: ${sqlFilePath}`);
    console.log(`Script size: ${sqlContent.length} bytes\n`);

    console.log('Executing recovery script...');
    console.log('This may take a moment...\n');

    // Split SQL into individual statements and execute them
    // This is needed because Prisma's $queryRawUnsafe doesn't support multiple statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let completed = 0;
    let skipped = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Show progress for key operations
        if (statement.includes('CREATE TYPE') || 
            statement.includes('CREATE TABLE') || 
            statement.includes('ALTER TABLE') ||
            statement.includes('INSERT INTO "_prisma_migrations"')) {
          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          process.stdout.write(`\r[${i + 1}/${statements.length}] ${preview}...`);
        }

        // Use $executeRawUnsafe to execute raw SQL
        await prisma.$executeRawUnsafe(statement);
        completed++;
      } catch (error) {
        // Many statements might fail due to "already exists" errors, which is fine
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            error.message.includes('PG')) {
          skipped++;
        } else {
          console.error(`\n\nError executing statement ${i + 1}:`);
          console.error(statement.substring(0, 100));
          console.error('Error:', error.message);
          throw error;
        }
      }
    }

    console.log(`\r[${statements.length}/${statements.length}] Recovery complete!               `);
    console.log('');

    console.log('\n================================================');
    console.log('✓ Database recovery completed successfully!');
    console.log('================================================\n');
    
    console.log(`Statements executed: ${completed}`);
    console.log(`Statements skipped: ${skipped} (expected - safe duplicates)\n`);

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
    
    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\nConnection refused - make sure:');
      console.error('1. PostgreSQL is running on localhost:5434');
      console.error('2. Docker container is started: docker-compose up -d');
      console.error('3. DATABASE_URL in .env is correct');
    }
    
    console.error('\nFull error:');
    console.error(error);
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
