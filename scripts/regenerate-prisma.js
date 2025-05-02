const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Delete the existing Prisma client directory
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  if (fs.existsSync(prismaClientPath)) {
    fs.rmSync(prismaClientPath, { recursive: true, force: true });
  }

  // Generate the Prisma client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Prisma client generated successfully!');
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
} 