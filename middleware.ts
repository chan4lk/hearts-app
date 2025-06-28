import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasAccess, getDefaultRedirectPath } from "./app/utils/roleAccess";
import { Role } from "@prisma/client";

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
    
    // Debug information
    console.log(`[Middleware] Path: ${path}`);
    console.log(`[Middleware] Token present: ${!!token}`);
    console.log(`[Middleware] User role: ${token?.role || 'none'}`);

    // If on login page and user is authenticated, redirect to appropriate dashboard
    if (path === '/login' && token) {
      const userRole = token.role as Role;
      const redirectPath = getDefaultRedirectPath(userRole);
      console.log(`[Middleware] Redirecting authenticated user from login to: ${redirectPath}`);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Allow access to public routes
    if (path === '/register' || path === '/login' || path === '/error') {
      console.log(`[Middleware] Allowing access to public route: ${path}`);
      return NextResponse.next();
    }
    
    // Handle API routes
    if (path.startsWith('/api/')) {
      console.log(`[Middleware] Allowing access to API route: ${path}`);
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      console.log(`[Middleware] No auth token, redirecting to login`);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const userRole = token.role as Role;
    if (!hasAccess(userRole, path)) {
      console.log(`[Middleware] Unauthorized access to ${path} by role: ${userRole}`);
      const defaultPath = getDefaultRedirectPath(userRole);
      console.log(`[Middleware] Redirecting to default path: ${defaultPath}`);
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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