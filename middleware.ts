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
    console.log(`[Middleware] Processing request:`, {
      path,
      hasToken: !!token,
      userRole: token?.role || 'none',
      userId: token?.id || 'none'
    });

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
      loginUrl.searchParams.set("callbackUrl", encodeURIComponent(path));
      return NextResponse.redirect(loginUrl);
    }

    const userRole = token.role as Role;
    console.log(`[Middleware] Processing role-based access:`, {
      role: userRole,
      path,
      userId: token.id
    });

    // If on login page and authenticated, redirect to appropriate dashboard
    if (path === '/login') {
      const redirectPath = getDefaultRedirectPath(userRole);
      console.log(`[Middleware] Redirecting from login to dashboard:`, {
        role: userRole,
        redirectPath
      });
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // If accessing root or dashboard root, redirect to role-specific dashboard
    if (path === '/' || path === '/dashboard') {
      const defaultPath = getDefaultRedirectPath(userRole);
      console.log(`[Middleware] Redirecting to role-specific dashboard:`, {
        role: userRole,
        defaultPath
      });
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }

    // Check access permissions for dashboard routes
    if (path.startsWith('/dashboard/')) {
      const hasRouteAccess = hasAccess(userRole, path);
      console.log(`[Middleware] Checking dashboard access:`, {
        role: userRole,
        path,
        hasAccess: hasRouteAccess
      });

      if (!hasRouteAccess) {
        // For admin users, try to preserve the current dashboard context
        if (userRole === 'ADMIN') {
          const currentContext = path.split('/')[2]; // Get 'admin', 'manager', or 'employee'
          const defaultContextPath = `/dashboard/${currentContext}`;
          console.log(`[Middleware] Preserving admin context:`, {
            role: userRole,
            from: path,
            to: defaultContextPath,
            context: currentContext
          });
          return NextResponse.redirect(new URL(defaultContextPath, req.url));
        }

        // For other roles, redirect to their default dashboard
        const defaultPath = getDefaultRedirectPath(userRole);
        console.log(`[Middleware] Access denied, redirecting:`, {
          role: userRole,
          from: path,
          to: defaultPath,
          reason: 'Insufficient permissions'
        });
        return NextResponse.redirect(new URL(defaultPath, req.url));
      }

      // Only redirect dashboard roots for non-admin users
      if (userRole !== 'ADMIN') {
        const dashboardRoots = ['/dashboard/admin', '/dashboard/manager', '/dashboard/employee'];
        if (dashboardRoots.includes(path)) {
          const defaultPath = getDefaultRedirectPath(userRole);
          if (path !== defaultPath) {
            console.log(`[Middleware] Redirecting non-admin from dashboard root:`, {
              role: userRole,
              from: path,
              to: defaultPath
            });
            return NextResponse.redirect(new URL(defaultPath, req.url));
          }
        }
      }
    }

    console.log(`[Middleware] Access granted:`, {
      role: userRole,
      path
    });
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        const isAuthorized = !!token;
        console.log(`[Middleware] Authorization check:`, {
          hasToken: !!token,
          isAuthorized
        });
        return isAuthorized;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/api/((?!auth).)*",  // Block all API routes except auth
    "/login",
    "/register",
  ],
}; 