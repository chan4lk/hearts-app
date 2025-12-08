export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

/**
 * PDF Report Generation API
 * 
 * This endpoint generates PDF reports for analytics data.
 * Currently returns JSON data that can be used by client-side PDF generation.
 * 
 * For full PDF generation, install: npm install jspdf jspdf-autotable
 * or use a headless browser like puppeteer for HTML-to-PDF conversion.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { reportType, analyticsData, options = {} } = body;

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
        reportData = await analyticsResponse.json();
      }
    }

    if (!reportData) {
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Generate report based on type
    switch (reportType) {
      case 'dashboard':
        return generateDashboardReport(reportData, options);
      case 'performance':
        return generatePerformanceReport(reportData, options);
      case 'goals':
        return generateGoalsReport(reportData, options);
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

function generateDashboardReport(data: any, options: any) {
  const report = {
    title: 'Performance Dashboard Report',
    generatedAt: new Date().toISOString(),
    summary: data.summary,
    breakdowns: data.breakdowns,
    employeePerformance: data.employeePerformance,
    meta: data.meta
  };

  // Return structured data that can be converted to PDF client-side
  // or use server-side PDF generation library
  return NextResponse.json({
    success: true,
    report,
    format: 'json', // Can be 'pdf' when PDF generation is implemented
    message: 'Report generated. Install jspdf or puppeteer for PDF export.'
  });
}

function generatePerformanceReport(data: any, options: any) {
  const report = {
    title: 'Performance Review Report',
    generatedAt: new Date().toISOString(),
    employeePerformance: data.employeePerformance,
    summary: {
      totalEmployees: data.summary.totalUsers,
      averageCompletionRate: data.summary.completionRate,
      averageRating: data.summary.averageRating
    },
    meta: data.meta
  };

  return NextResponse.json({
    success: true,
    report,
    format: 'json'
  });
}

function generateGoalsReport(data: any, options: any) {
  const report = {
    title: 'Goals Summary Report',
    generatedAt: new Date().toISOString(),
    summary: data.summary,
    breakdowns: {
      byStatus: data.breakdowns.byStatus,
      byCategory: data.breakdowns.byCategory,
      byPriority: data.breakdowns.byPriority
    },
    meta: data.meta
  };

  return NextResponse.json({
    success: true,
    report,
    format: 'json'
  });
}


