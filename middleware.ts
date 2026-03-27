import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/feed',
  MANAGER: '/dashboard/feed',
  EMPLOYEE: '/dashboard/feed'
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.next();

    const userRole = token.role as Role;

    // /dashboard root → redirect to role dashboard
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD_MAP[userRole] || '/dashboard/employee', req.url));
    }

    // Role-based access for admin routes
    if (path.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/feed', req.url));
    }

    // Team page requires Manager or Admin
    if (path.startsWith('/dashboard/team') && userRole === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/dashboard/feed', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Only require auth for dashboard routes
        if (path.startsWith('/dashboard')) return !!token;
        return true; // Allow all other routes
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
