import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Debug information for Azure deployment
    console.log(`Middleware executing for path: ${path}`);
    console.log(`Auth token present: ${!!token}`);
    console.log(`User role: ${token?.role || 'none'}`);
    
    // Log cookies for debugging
    const cookies = req.cookies.getAll();
    console.log(`Cookies: ${JSON.stringify(cookies.map(c => ({ name: c.name, value: c.name.includes('token') ? '[REDACTED]' : c.value })))}`);

    // Allow access to register and login pages
    if (path === '/register' || path === '/login') {
      return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control
    if (path.startsWith("/dashboard/admin")) {
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/employee", req.url));
      }
    } else if (path.startsWith("/dashboard/manager")) {
      if (token.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/dashboard/employee", req.url));
      }
    } else if (path.startsWith("/dashboard/employee")) {
      // Allow all authenticated users to access employee dashboard
      return NextResponse.next();
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