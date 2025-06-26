import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasAccess, getDefaultRedirectPath, UserRole } from "./app/utils/roleAccess";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Debug information for Azure deployment
    console.log(`Middleware executing for path: ${path}`);
    console.log(`Auth token present: ${!!token}`);
    console.log(`User role: ${token?.role || 'none'}`);
    
    // Log token details for debugging
    console.log(`Token details: ${JSON.stringify(token)}`);

    // Log cookies for debugging
    const cookies = req.cookies.getAll();
    console.log(`Cookies: ${JSON.stringify(cookies.map(c => ({ name: c.name, value: c.name.includes('token') ? '[REDACTED]' : c.value })))}`);

    // Allow access to public routes
    if (path === '/register' || path === '/login' || path === '/error') {
      console.log(`[Middleware] Allowing access to: ${path}`);
      return NextResponse.next();
    }
    
    // Handle API routes separately
    if (path.startsWith('/api/')) {
      console.log(`[Middleware] Allowing access to API route: ${path}`);
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      console.log(`[Middleware] No auth token, redirecting to login`);
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control
    const userRole = token.role.toLowerCase() as UserRole;
    if (!hasAccess(userRole, path)) {
      console.log(`[Middleware] Unauthorized access attempt to ${path} by role: ${userRole}`);
      return NextResponse.redirect(new URL(getDefaultRedirectPath(userRole), req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow access to register and login pages without authentication
        if (path === '/register' || path === '/login') {
          return true;
        }
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