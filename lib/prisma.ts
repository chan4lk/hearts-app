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

// In development, check for existing client FIRST to prevent connection leaks
// This is critical for Next.js hot reloading - prevents creating new connections on each reload
if (process.env.NODE_ENV === 'development' && globalForPrisma.prisma) {
  prismaClient = globalForPrisma.prisma;
} else {
  // Create a new PrismaClient instance only if one doesn't exist
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

  // Store in global scope for development to prevent multiple instances
  if (process.env.NODE_ENV === 'development') {
    globalForPrisma.prisma = prismaClient;
  }
}

// Don't call $connect() eagerly - Prisma connects lazily when needed
// This prevents connection pool exhaustion during hot reloads in development
// The connection will be established automatically on first query

// Graceful shutdown - only set up once (not in development to avoid multiple handlers)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
  process.on('beforeExit', async () => {
    await prismaClient.$disconnect();
  });
}

// Export the Prisma client
// Note: Prisma connects lazily on first query, so we don't need to call $connect() here
export const prisma = prismaClient; 