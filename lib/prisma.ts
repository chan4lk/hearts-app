import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

// Create a new PrismaClient instance
prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// In development, store the client in the global scope to prevent hot reloading issues
if (process.env.NODE_ENV === 'development') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClient;
  }
}

export const prisma = prismaClient; 