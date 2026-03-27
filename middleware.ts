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

    // Allow public routes
    if (path === '/register' || path === '/login' || path === '/error' || path === '/') {
      return NextResponse.next();
    }

    // Allow API routes
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(path));
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as Role;

    // If on login page and authenticated, redirect to dashboard
    if (path === '/login') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD_MAP[userRole] || '/dashboard/employee', req.url));
    }

    // If accessing /dashboard root, redirect to role-specific dashboard
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD_MAP[userRole] || '/dashboard/employee', req.url));
    }

    // Role-based access: Admin can access everything, others restricted to their portal
    if (path.startsWith('/dashboard/')) {
      if (userRole === 'ADMIN') return NextResponse.next(); // Admin can access all
      if (userRole === 'MANAGER' && (path.startsWith('/dashboard/manager') || path.startsWith('/dashboard/employee'))) return NextResponse.next();
      if (userRole === 'EMPLOYEE' && path.startsWith('/dashboard/employee')) return NextResponse.next();

      // Redirect to own dashboard if unauthorized
      return NextResponse.redirect(new URL(ROLE_DASHBOARD_MAP[userRole] || '/dashboard/employee', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/((?!auth).)*', '/login', '/register'],
};
