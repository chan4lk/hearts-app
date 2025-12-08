import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a new PrismaClient instance with improved configuration
prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  errorFormat: 'pretty',
});

// Handle Prisma connection errors
prismaClient.$connect().catch((error) => {
  logger.error(error instanceof Error ? error : new Error(String(error)));
  throw new Error('Failed to connect to database');
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
  });
}

// In development, store the client in the global scope to prevent hot reloading issues
if (process.env.NODE_ENV === 'development') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClient;
  }
}

export const prisma = prismaClient; 