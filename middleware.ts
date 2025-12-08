import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasAccess, getDefaultRedirectPath } from "./app/utils/roleAccess";
import { Role } from "@prisma/client";
// Note: Not importing logger here to avoid bundling applicationinsights in middleware
// Middleware runs in Edge runtime which doesn't support Node.js modules

// Map database roles to dashboard paths
const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee'
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Only log in development - never log sensitive info in production
    // Using console.log instead of logger to avoid bundling applicationinsights in middleware
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Processing request', { path, hasToken: !!token });
    }

    // Allow access to public routes
    if (path === '/register' || path === '/login' || path === '/error' || path === '/') {
      return NextResponse.next();
    }
    
    // Handle API routes
    if (path.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] No auth token, redirecting to login', { path });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(path));
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as Role;

    // If on login page and authenticated, redirect to appropriate dashboard
    if (path === '/login') {
      const redirectPath = getDefaultRedirectPath(userRole);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // If accessing dashboard root, redirect to role-specific dashboard
    if (path === '/dashboard') {
      const defaultPath = getDefaultRedirectPath(userRole);
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }

    // Check access permissions for dashboard routes
    if (path.startsWith('/dashboard/')) {
      const hasRouteAccess = hasAccess(userRole, path);

      // If access is granted (including admin access), proceed
      if (hasRouteAccess) {
        return NextResponse.next();
      }

      // If access is denied, redirect to default dashboard
      const defaultPath = getDefaultRedirectPath(userRole);
      if (process.env.NODE_ENV === 'development') {
        console.log('[Middleware] Access denied, redirecting', { path, role: userRole });
      }
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Don't log authorization checks - security risk
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/((?!auth).)*",  // Block all API routes except auth
    "/login",
    "/register",
  ],
}; 