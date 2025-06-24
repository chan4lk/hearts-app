import type { Role, User as PrismaUser } from '.prisma/client';
import type { User } from 'next-auth';

// Role hierarchy configuration
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  ADMIN: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  MANAGER: ['MANAGER', 'EMPLOYEE'],
  EMPLOYEE: ['EMPLOYEE'],
};

// Role hierarchy utility functions
export const canAccessRole = (userRole: Role, targetRole: Role): boolean => {
  return ROLE_HIERARCHY[userRole].includes(targetRole as Role);
};

export const getAvailableRoles = (userRole: Role): Role[] => {
  return [...ROLE_HIERARCHY[userRole]];
};

declare module 'next-auth' {
  interface User extends Omit<PrismaUser, 'activeRole'> {
    activeRole?: Role;
  }
  interface Session {
    user: User & {
      activeRole?: Role;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    activeRole?: Role;
  }
}

export { authOptions } from './auth-config';

// Server-side auth utilities are moved to server-auth.ts 
