import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isTemplate = searchParams.get('template') === 'true';

    if (isTemplate) {
      // Generate template Excel file
      const templateData = [
        ['Email', 'Name', 'Reporting Person Email', 'Reporting Person Name', 'Job Category', 'Designation', 'Date of Appointment', 'After 6 Months', 'Review Month', 'Adjusted Review Month'],
        ['user@example.com', 'John Doe', 'manager@example.com', 'Manager Name', 'Executive', 'Software Engineer', '2024-01-15', 'July', 'January', '']
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // Email
        { wch: 20 }, // Name
        { wch: 25 }, // Reporting Person Email
        { wch: 20 }, // Reporting Person Name
        { wch: 15 }, // Job Category
        { wch: 20 }, // Designation
        { wch: 18 }, // Date of Appointment
        { wch: 12 }, // After 6 Months
        { wch: 12 }, // Review Month
        { wch: 18 }  // Adjusted Review Month
      ];

      // Note: XLSX library doesn't fully support styling in the free version
      // Column widths are set via '!cols' above

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Cycles Template');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="review-cycles-template.xlsx"'
        }
      });
    } else {
      // Export actual data
      const reviewCycles = await prisma.reviewCycle.findMany({
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          reportingPerson: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const exportData = [
        ['Email', 'Name', 'Reporting Person Email', 'Reporting Person Name', 'Job Category', 'Designation', 'Date of Appointment', 'After 6 Months', 'Review Month', 'Adjusted Review Month']
      ];

      reviewCycles.forEach(cycle => {
        exportData.push([
          cycle.user.email || '',
          cycle.user.name || '',
          cycle.reportingPerson?.email || '',
          cycle.reportingPerson?.name || '',
          cycle.jobCategory || '',
          cycle.designation || '',
          cycle.dateOfAppointment ? new Date(cycle.dateOfAppointment).toLocaleDateString('en-CA') : '',
          cycle.after6Months || '',
          cycle.reviewMonth || '',
          cycle.adjustedReviewMonth || ''
        ]);
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(exportData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 25 }, // Email
        { wch: 20 }, // Name
        { wch: 25 }, // Reporting Person Email
        { wch: 20 }, // Reporting Person Name
        { wch: 15 }, // Job Category
        { wch: 20 }, // Designation
        { wch: 18 }, // Date of Appointment
        { wch: 12 }, // After 6 Months
        { wch: 12 }, // Review Month
        { wch: 18 }  // Adjusted Review Month
      ];

      // Note: XLSX library doesn't fully support styling in the free version
      // Column widths are set via '!cols' above

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Cycles');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      const filename = `review-cycles-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
  } catch (error) {
    logger.error('Export error:', error);
    return handleApiError(error);
  }
}
