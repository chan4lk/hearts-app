#!/usr/bin/env node

/**
 * Fix Prisma Client Types
 * Regenerates the Prisma client to recognize all database models
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n================================================');
console.log('Fixing Prisma Client Types');
console.log('================================================\n');

try {
  // Get Prisma client path
  const prismaClientPath = path.join(__dirname, '../node_modules/.prisma/client');
  
  console.log('1. Clearing Prisma cache...');
  
  // Remove Prisma client directory to force regeneration
  if (fs.existsSync(prismaClientPath)) {
    console.log(`   - Found at: ${prismaClientPath}`);
    
    // Get all files in the directory
    const files = fs.readdirSync(prismaClientPath);
    console.log(`   - Clearing ${files.length} cached files...`);
    
    // Remove all files
    files.forEach(file => {
      const filePath = path.join(prismaClientPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
    
    console.log('   ✓ Cache cleared\n');
  }

  console.log('2. Regenerating Prisma client...');
  console.log('   (This may take a moment)\n');

  // Try to regenerate
  try {
    // First try with npm script
    execSync('npm run prisma:generate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 60000
    });
  } catch (e) {
    // If npm script fails, try direct prisma command
    console.log('   Trying direct prisma generate...\n');
    execSync('npx prisma generate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      timeout: 60000
    });
  }

  console.log('\n================================================');
  console.log('✓ Prisma client regenerated successfully!');
  console.log('================================================\n');

  console.log('The TypeScript errors should now be resolved.');
  console.log('You may need to restart your IDE for the changes to take effect.\n');

  process.exit(0);
} catch (error) {
  console.error('\n================================================');
  console.error('✗ Failed to regenerate Prisma client');
  console.error('================================================\n');
  console.error('Error:', error.message);
  
  console.error('\nManual fix:');
  console.error('1. Open a terminal in your project');
  console.error('2. Run: npm run prisma:generate');
  console.error('3. Restart your IDE\n');

  process.exit(1);
}
