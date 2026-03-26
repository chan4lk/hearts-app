import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import * as XLSX from 'xlsx';
import { rateLimiters } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all review cycles (no pagination for export)
    const reviewCycles = await prisma.reviewCycle.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
          }
        },
        reportingPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform data for Excel export
    const excelData = reviewCycles.map((cycle) => ({
      'Employee Name': cycle.user.name || '',
      'Employee Email': cycle.user.email || '',
      'Reporting Person': cycle.reportingPerson?.name || '',
      'Reporting Person Email': cycle.reportingPerson?.email || '',
      'Job Category': cycle.jobCategory || '',
      'Designation': cycle.designation || '',
      'Date of Appointment': cycle.dateOfAppointment 
        ? new Date(cycle.dateOfAppointment).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : '',
      'After 6 Months': cycle.after6Months || '',
      'Review Month': cycle.reviewMonth || '',
      'Adjusted Review Month': cycle.adjustedReviewMonth || '',
      'Created At': cycle.createdAt 
        ? new Date(cycle.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : '',
      'Updated At': cycle.updatedAt 
        ? new Date(cycle.updatedAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        : '',
      'Updated By': cycle.updatedBy?.name || '',
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // Employee Name
      { wch: 30 }, // Employee Email
      { wch: 25 }, // Reporting Person
      { wch: 30 }, // Reporting Person Email
      { wch: 20 }, // Job Category
      { wch: 20 }, // Designation
      { wch: 20 }, // Date of Appointment
      { wch: 15 }, // After 6 Months
      { wch: 15 }, // Review Month
      { wch: 20 }, // Adjusted Review Month
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Updated By
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Cycles');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Generate filename with current date
    const filename = `review-cycles-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return Excel file as response
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
