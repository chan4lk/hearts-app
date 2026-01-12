import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import * as XLSX from 'xlsx';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper function to calculate review dates
function calculateReviewDates(dateOfAppointment: Date) {
  const sixMonthsLater = new Date(dateOfAppointment);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const after6Months = sixMonthsLater.toLocaleDateString('en-US', { month: 'long' });

  const oneYearLater = new Date(dateOfAppointment);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const reviewMonth = oneYearLater.toLocaleDateString('en-US', { month: 'long' });

  return { after6Months, reviewMonth };
}

// Helper function to parse date string
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try parsing as ISO date string
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try parsing Excel date number (days since 1900-01-01)
  const excelDateNumber = parseFloat(dateString);
  if (!isNaN(excelDateNumber) && excelDateNumber > 0) {
    // Excel epoch is January 1, 1900
    const excelEpoch = new Date(1900, 0, 1);
    const daysToAdd = excelDateNumber - 2; // Excel counts from 1, and has a bug with 1900 being a leap year
    date = new Date(excelEpoch);
    date.setDate(date.getDate() + daysToAdd);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try common date formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0]) {
        // YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else {
        // MM/DD/YYYY or MM-DD-YYYY
        date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      }
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

// Helper function to normalize month name
function normalizeMonth(monthString: string | null | undefined): string | null {
  if (!monthString) return null;
  
  const normalized = monthString.trim();
  const monthIndex = MONTHS.findIndex(m => 
    m.toLowerCase() === normalized.toLowerCase() ||
    m.substring(0, 3).toLowerCase() === normalized.substring(0, 3).toLowerCase()
  );
  
  return monthIndex !== -1 ? MONTHS[monthIndex] : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });

    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: 'Excel file must have at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Get headers (first row)
    const headers = (jsonData[0] as any[]).map((h: any) => String(h || '').trim().toLowerCase());
    
    // Expected column mappings
    const expectedColumns = {
      email: ['email', 'employee email', 'user email', 'e-mail'],
      name: ['name', 'employee name', 'full name', 'user name'],
      reportingpersonemail: ['reporting person email', 'manager email', 'reporting email', 'reportingperson email'],
      reportingpersonname: ['reporting person name', 'manager name', 'reporting name', 'reportingperson name'],
      jobcategory: ['job category', 'jobcategory', 'category'],
      designation: ['designation', 'position', 'title'],
      dateofappointment: ['date of appointment', 'appointment date', 'joined date', 'dateofappointment', 'join date'],
      after6months: ['after 6 months', '6 months', 'after6months', 'six months'],
      reviewmonth: ['review month', 'reviewmonth'],
      adjustedreviewmonth: ['adjusted review month', 'adjustedreviewmonth', 'adjusted month']
    };

    // Find column indices
    const columnMap: Record<string, number> = {};
    Object.entries(expectedColumns).forEach(([key, variations]) => {
      const index = headers.findIndex(h => variations.some(v => h.includes(v)));
      if (index !== -1) {
        columnMap[key] = index;
      }
    });

    // Validate required columns
    if (!columnMap.email && !columnMap.name) {
      return NextResponse.json(
        { error: 'Excel file must have either "Email" or "Name" column' },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      const rowNumber = i + 1; // Excel row number (1-indexed, accounting for header)

      if (!row || row.length === 0) continue;

      try {
        // Extract data from row
        const email = columnMap.email !== undefined ? String(row[columnMap.email] || '').trim() : '';
        const name = columnMap.name !== undefined ? String(row[columnMap.name] || '').trim() : '';
        const reportingPersonEmail = columnMap.reportingpersonemail !== undefined 
          ? String(row[columnMap.reportingpersonemail] || '').trim() 
          : '';
        const reportingPersonName = columnMap.reportingpersonname !== undefined 
          ? String(row[columnMap.reportingpersonname] || '').trim() 
          : '';
        const jobCategory = columnMap.jobcategory !== undefined 
          ? String(row[columnMap.jobcategory] || '').trim() 
          : null;
        const designation = columnMap.designation !== undefined 
          ? String(row[columnMap.designation] || '').trim() 
          : null;
        const dateOfAppointmentStr = columnMap.dateofappointment !== undefined 
          ? String(row[columnMap.dateofappointment] || '').trim() 
          : '';
        const after6Months = normalizeMonth(
          columnMap.after6months !== undefined 
            ? String(row[columnMap.after6months] || '').trim() 
            : null
        );
        const reviewMonth = normalizeMonth(
          columnMap.reviewmonth !== undefined 
            ? String(row[columnMap.reviewmonth] || '').trim() 
            : null
        );
        const adjustedReviewMonth = normalizeMonth(
          columnMap.adjustedreviewmonth !== undefined 
            ? String(row[columnMap.adjustedreviewmonth] || '').trim() 
            : null
        );

        // Validate required fields
        if (!email && !name) {
          result.errors.push({
            row: rowNumber,
            field: 'email/name',
            message: 'Either email or name is required'
          });
          result.failed++;
          continue;
        }

        // Find user by email or name
        let user;
        if (email) {
          user = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' }
            }
          });
        } else if (name) {
          user = await prisma.user.findFirst({
            where: {
              name: { equals: name, mode: 'insensitive' }
            }
          });
        }

        if (!user) {
          result.errors.push({
            row: rowNumber,
            field: email || name,
            message: `User not found: ${email || name}`
          });
          result.failed++;
          continue;
        }

        // Parse date of appointment
        let dateOfAppointment: Date | null = null;
        if (dateOfAppointmentStr) {
          dateOfAppointment = parseDate(dateOfAppointmentStr);
          if (!dateOfAppointment) {
            result.errors.push({
              row: rowNumber,
              field: 'dateOfAppointment',
              message: `Invalid date format: ${dateOfAppointmentStr}`
            });
            result.failed++;
            continue;
          }
        }

        // Calculate review dates if date of appointment is provided
        let calculatedAfter6Months = after6Months;
        let calculatedReviewMonth = reviewMonth;
        if (dateOfAppointment) {
          const calculated = calculateReviewDates(dateOfAppointment);
          if (!calculatedAfter6Months) {
            calculatedAfter6Months = calculated.after6Months;
          }
          if (!calculatedReviewMonth) {
            calculatedReviewMonth = calculated.reviewMonth;
          }
        }

        // Find reporting person if provided
        let reportingPersonId: string | null = null;
        if (reportingPersonEmail || reportingPersonName) {
          const orConditions: any[] = [];
          if (reportingPersonEmail) {
            orConditions.push({ email: { equals: reportingPersonEmail, mode: 'insensitive' } });
          }
          if (reportingPersonName) {
            orConditions.push({ name: { equals: reportingPersonName, mode: 'insensitive' } });
          }

          const reportingPerson = orConditions.length > 0
            ? await prisma.user.findFirst({
                where: { OR: orConditions }
              })
            : null;
          
          if (reportingPerson) {
            reportingPersonId = reportingPerson.id;
          } else if (reportingPersonEmail || reportingPersonName) {
            result.errors.push({
              row: rowNumber,
              field: 'reportingPerson',
              message: `Reporting person not found: ${reportingPersonEmail || reportingPersonName}`
            });
            // Continue anyway - reporting person is optional
          }
        }

        // Check if review cycle exists before upsert
        const existingCycle = await prisma.reviewCycle.findUnique({
          where: { userId: user.id }
        });

        // Create or update review cycle
        await prisma.reviewCycle.upsert({
          where: { userId: user.id },
          update: {
            reportingPersonId,
            jobCategory,
            designation,
            dateOfAppointment,
            after6Months: calculatedAfter6Months,
            reviewMonth: calculatedReviewMonth,
            adjustedReviewMonth,
            updatedById: session.user.id,
            updatedAt: new Date()
          },
          create: {
            userId: user.id,
            reportingPersonId,
            jobCategory,
            designation,
            dateOfAppointment,
            after6Months: calculatedAfter6Months,
            reviewMonth: calculatedReviewMonth,
            adjustedReviewMonth,
            updatedById: session.user.id
          }
        });

        // Create notification for the user
        await prisma.notification.create({
          data: {
            type: existingCycle ? NotificationType.REVIEW_CYCLE_UPDATED : NotificationType.REVIEW_CYCLE_CREATED,
            message: `Your review cycle has been ${existingCycle ? 'updated' : 'created'} by ${session.user.name || 'Admin'}`,
            userId: user.id,
          },
        });

        result.success++;
      } catch (error) {
        logger.error(`Error processing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        result.failed++;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Import error:', error);
    return handleApiError(error);
  }
}
