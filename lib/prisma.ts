import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaClient: PrismaClient;

// During build time, return a mock client
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
  prismaClient = {
    user: {
      findMany: async () => [],
      findUnique: async () => null,
    },
    goal: {
      findMany: async () => [],
      findUnique: async () => null,
    },
    rating: {
      findMany: async () => [],
      findUnique: async () => null,
    },
  } as unknown as PrismaClient;
} else {
  prismaClient = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;
}

export const prisma = prismaClient; 