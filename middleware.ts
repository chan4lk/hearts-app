import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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