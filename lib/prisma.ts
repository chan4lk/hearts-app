import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a new PrismaClient instance
const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// In development, store the client in the global scope to prevent hot reloading issues
if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient; 