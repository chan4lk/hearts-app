import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee'
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

    // Role-based access
    if (path.startsWith('/dashboard/')) {
      if (userRole === 'ADMIN') return NextResponse.next();
      if (userRole === 'MANAGER' && (path.startsWith('/dashboard/manager') || path.startsWith('/dashboard/employee'))) return NextResponse.next();
      if (userRole === 'EMPLOYEE' && path.startsWith('/dashboard/employee')) return NextResponse.next();

      return NextResponse.redirect(new URL(ROLE_DASHBOARD_MAP[userRole] || '/dashboard/employee', req.url));
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
