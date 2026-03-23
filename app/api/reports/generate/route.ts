export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

/**
 * Report Generation API
 * 
 * This endpoint generates reports (JSON or PDF) for analytics data.
 * Supports both JSON export and PDF generation using jsPDF.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportType, analyticsData, format = 'json', options = {} } = body;

    // Fetch analytics if not provided
    let reportData = analyticsData;
    if (!reportData) {
      const analyticsResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analytics/dashboard?${new URLSearchParams(options.filters || {}).toString()}`,
        {
          headers: {
            Cookie: req.headers.get('Cookie') || ''
          }
        }
      );
      
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        reportData = analyticsResult.success ? analyticsResult : { success: true, ...analyticsResult };
      }
    }

    if (!reportData) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Generate report based on type and format
    switch (reportType) {
      case 'dashboard':
        return generateDashboardReport(reportData, format, options, session.user);
      case 'performance':
        return generatePerformanceReport(reportData, format, options, session.user);
      case 'goals':
        return generateGoalsReport(reportData, format, options, session.user);
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

function generateDashboardReport(data: any, format: string, options: any, user: any) {
  const report = {
    title: 'Performance Dashboard Report',
    generatedAt: new Date().toISOString(),
    summary: data.summary || {},
    breakdowns: data.breakdowns || {},
    trends: data.trends || {},
    employeePerformance: data.employeePerformance || [],
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || user.email,
      role: user.role,
      filters: options.filters || {}
    }
  };

  if (format === 'pdf') {
    // PDF generation is handled client-side for better performance
    // Return the data needed for PDF generation
    return NextResponse.json({
      success: true,
      report,
      format: 'pdf',
      message: 'PDF data prepared. Generate PDF on client side.'
    });
  }

  // Enhanced JSON export
  return NextResponse.json({
    success: true,
    report,
    format: 'json'
  });
}

function generatePerformanceReport(data: any, format: string, options: any, user: any) {
  const report = {
    title: 'Performance Review Report',
    generatedAt: new Date().toISOString(),
    employeePerformance: data.employeePerformance || [],
    summary: {
      totalEmployees: data.summary?.totalUsers || 0,
      averageCompletionRate: data.summary?.completionRate || 0,
      averageRating: data.summary?.averageRating || 0
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || user.email,
      role: user.role,
      filters: options.filters || {}
    }
  };

  if (format === 'pdf') {
    return NextResponse.json({
      success: true,
      report,
      format: 'pdf',
      message: 'PDF data prepared. Generate PDF on client side.'
    });
  }

  return NextResponse.json({
    success: true,
    report,
    format: 'json'
  });
}

function generateGoalsReport(data: any, format: string, options: any, user: any) {
  const report = {
    title: 'Goals Summary Report',
    generatedAt: new Date().toISOString(),
    summary: data.summary || {},
    breakdowns: {
      byStatus: data.breakdowns?.byStatus || {},
      byCategory: data.breakdowns?.byCategory || {},
      byPriority: data.breakdowns?.byPriority || {}
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || user.email,
      role: user.role,
      filters: options.filters || {}
    }
  };

  if (format === 'pdf') {
    return NextResponse.json({
      success: true,
      report,
      format: 'pdf',
      message: 'PDF data prepared. Generate PDF on client side.'
    });
  }

  return NextResponse.json({
    success: true,
    report,
    format: 'json'
  });
}


