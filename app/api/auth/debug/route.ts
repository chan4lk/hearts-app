import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    // Get all cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll().map(cookie => ({
      name: cookie.name,
      value: cookie.name.includes('token') || cookie.name.includes('session') ? '[REDACTED]' : cookie.value,
      // Next.js RequestCookie only has name and value properties
    }));

    // Get environment info (safe to expose)
    const envInfo = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_DOMAIN: process.env.NEXTAUTH_DOMAIN,
      NODE_ENV: process.env.NODE_ENV,
      // Don't include sensitive values like secrets or API keys
      AZURE_AD_CLIENT_ID_SET: !!process.env.AZURE_AD_CLIENT_ID,
      AZURE_AD_CLIENT_SECRET_SET: !!process.env.AZURE_AD_CLIENT_SECRET,
      AZURE_AD_TENANT_ID_SET: !!process.env.AZURE_AD_TENANT_ID,
    };

    return NextResponse.json({
      status: 'success',
      session: session ? {
        user: session.user,
        expires: session.expires,
      } : null,
      cookies: allCookies,
      environment: envInfo,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
