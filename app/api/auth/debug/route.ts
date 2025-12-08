import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Debug endpoint - RESTRICTED TO DEVELOPMENT MODE AND ADMIN USERS ONLY
 * This endpoint should be removed or further restricted in production
 */
export async function GET() {
  try {
    // SECURITY: Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    // SECURITY: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY: Only allow admin users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get environment info (safe to expose - no secrets)
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      // Only show if variables are set, not their values
      AZURE_AD_CLIENT_ID_SET: !!process.env.AZURE_AD_CLIENT_ID,
      AZURE_AD_CLIENT_SECRET_SET: !!process.env.AZURE_AD_CLIENT_SECRET,
      AZURE_AD_TENANT_ID_SET: !!process.env.AZURE_AD_TENANT_ID,
      NEXTAUTH_URL_SET: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
    };

    // Return minimal safe information
    return NextResponse.json({
      status: 'success',
      environment: envInfo,
      session: {
        hasSession: !!session,
        userRole: session.user.role,
        // Don't expose user details
      },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
