import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Configure runtime and caching
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Export the handler for GET and POST methods
export { handler as GET, handler as POST }; 