import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based access control
    if (path.startsWith("/dashboard/employee") && token.role !== "EMPLOYEE") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/manager") && token.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/dashboard/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
    "/goals/:path*",
    "/team/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/api/goals/:path*",
  ],
}; 