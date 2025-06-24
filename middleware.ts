import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role } from '@prisma/client';
import type { NextRequest } from 'next/server';

// Define route patterns and their required roles
const ROLE_ROUTES: Record<string, Role[]> = {
  '/dashboard/admin': ['ADMIN'],
  '/dashboard/manager': ['ADMIN', 'MANAGER'],
  '/dashboard/employee': ['ADMIN', 'MANAGER', 'EMPLOYEE'],
};

// Helper function to check if a role can access another role's routes
const canAccessRole = (userRole: Role, targetRole: Role): boolean => {
  const roleHierarchy: Record<Role, Role[]> = {
    ADMIN: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
    MANAGER: ['MANAGER', 'EMPLOYEE'],
    EMPLOYEE: ['EMPLOYEE'],
  };
  return roleHierarchy[userRole].includes(targetRole);
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // If there's no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Get the user's base role and active role from the token
  const baseRole = token.role as Role;
  const activeRole = (token.activeRole as Role) || baseRole;

  // Check if the current path requires role-based access
  const path = request.nextUrl.pathname;
  
  // Extract the target role from the path
  const targetRole = path.split('/')[2]?.toUpperCase() as Role;
  
  if (targetRole && ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(targetRole)) {
    // Check if the user's base role can access the target role's routes
    if (!canAccessRole(baseRole, targetRole)) {
      // Redirect to their highest accessible dashboard
      if (baseRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      } else if (baseRole === 'MANAGER') {
        return NextResponse.redirect(new URL('/dashboard/manager', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard/employee', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
    '/api/manager/:path*',
  ],
}; 