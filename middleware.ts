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

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // If there's no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Get the active role from the token
  const activeRole = (token.activeRole as Role) || (token.role as Role);

  // Check if the current path requires role-based access
  const path = request.nextUrl.pathname;
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route)) {
      // If the user's active role is not allowed for this route
      if (!allowedRoles.includes(activeRole)) {
        // Redirect to the highest level dashboard they have access to
        if (activeRole === 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        } else if (activeRole === 'MANAGER') {
          return NextResponse.redirect(new URL('/dashboard/manager', request.url));
        } else {
          return NextResponse.redirect(new URL('/dashboard/employee', request.url));
        }
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