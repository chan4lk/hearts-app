import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  failed: number;
  skipped: number; // Users not found in system (not an error, just skipped)
  usersCreated: number; // Users auto-created during import
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
    // D-Mon-YY or DD-Mon-YY (e.g., "1-Aug-24", "23-Mar-21")
    /(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/i,
    // D/Mon/YY or DD/Mon/YY
    /(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})/i,
    // YYYY-MM-DD
    /(\d{4})-(\d{2})-(\d{2})/,
    // MM/DD/YYYY
    /(\d{2})\/(\d{2})\/(\d{4})/,
    // MM-DD-YYYY
    /(\d{2})-(\d{2})-(\d{4})/,
    // DD/MM/YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      // Handle month name formats (D-Mon-YY)
      if (format.source.includes('[A-Za-z]')) {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        let year = parseInt(match[3]);
        
        // Convert 2-digit year to 4-digit (assume 2000-2099)
        if (year < 100) {
          year = 2000 + year;
        }
        
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m => monthName.startsWith(m));
        
        if (monthIndex !== -1) {
          date = new Date(year, monthIndex, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      } else if (format === formats[2]) {
        // YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else if (format === formats[3] || format === formats[4]) {
        // MM/DD/YYYY or MM-DD-YYYY
        date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
      } else if (format === formats[5]) {
        // DD/MM/YYYY
        date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
      
      if (date && !isNaN(date.getTime())) {
        return date;
      }
    }
  }

  // Last resort: try JavaScript Date constructor
  const jsDate = new Date(dateString);
  if (!isNaN(jsDate.getTime())) {
    return jsDate;
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

    // Get headers (first row) - normalize and filter empty
    const rawHeaders = (jsonData[0] as any[]) || [];
    const headers = rawHeaders
      .map((h: any) => String(h || '').trim())
      .filter((h: string) => h.length > 0);
    
    if (headers.length === 0) {
      return NextResponse.json(
        { error: 'Excel file must have a header row with column names' },
        { status: 400 }
      );
    }
    
    // Expected column mappings - more flexible matching
    const expectedColumns = {
      email: ['email', 'employee email', 'user email', 'e-mail', 'e mail', 'emp email', 'useremail', 'empemail'],
      name: ['name', 'employee name', 'full name', 'user name', 'emp name', 'employeename', 'username', 'fullname', 'employee', 'user', 'emp'],
      reportingpersonemail: ['reporting person email', 'manager email', 'reporting email', 'reportingperson email', 'reporting person e-mail', 'reportingpersonemail', 'reporting email', 'manager e-mail', 'manageremail'],
      reportingpersonname: ['reporting person name', 'manager name', 'reporting name', 'reportingperson name', 'reportingpersonname', 'reporting person', 'manager', 'reportingmanager', 'reporting'],
      jobcategory: ['job category', 'jobcategory', 'category', 'job cat', 'job_category', 'job_cat'],
      designation: ['designation', 'position', 'title', 'job title', 'jobtitle', 'role', 'job designation'],
      dateofappointment: ['date of appointment', 'appointment date', 'joined date', 'dateofappointment', 'join date', 'appointment', 'date of joining', 'joining date', 'appointmentdate', 'joined', 'joining'],
      after6months: ['after 6 months', '6 months', 'after6months', 'six months', 'after 6months', '6months', 'after six months'],
      reviewmonth: ['review month', 'reviewmonth', 'review_month', 'review'],
      adjustedreviewmonth: ['adjusted review month', 'adjustedreviewmonth', 'adjusted month', 'adjusted reviewmonth', 'adjusted_review_month', 'adjusted']
    };

    // Find column indices - simplified and more reliable matching
    const columnMap: Record<string, number> = {};
    
    // Log headers for debugging
    if (process.env.NODE_ENV === 'development') {
      try {
        logger.log(`Processing headers: ${headers.join(', ')}`, 'Information');
      } catch (logError) {
        // Ignore logging errors
      }
    }
    
    // Helper function to normalize strings for comparison (removes spaces, hyphens, underscores, case-insensitive)
    const normalize = (str: string): string => {
      return str.toLowerCase().trim().replace(/[\s_-]+/g, '');
    };
    
    // Helper function to check if two strings match - very aggressive matching
    const matches = (header: string, variation: string): boolean => {
      const normHeader = normalize(header);
      const normVar = normalize(variation);
      
      // Exact match (after normalization)
      if (normHeader === normVar) return true;
      
      // Contains match (either direction) - most flexible
      if (normHeader.includes(normVar) || normVar.includes(normHeader)) return true;
      
      // Starts with or ends with
      if (normHeader.startsWith(normVar) || normVar.startsWith(normHeader)) return true;
      
      // Simple lowercase comparison (for "Employee" vs "employee")
      if (header.toLowerCase().trim() === variation.toLowerCase().trim()) return true;
      
      // Word-based match - all words from variation must be in header
      const varWords = normVar.split(/\s+/).filter(w => w.length > 0);
      if (varWords.length > 0 && varWords.every(word => normHeader.includes(word))) return true;
      
      // Check if any significant word matches (for "Employee" matching "employee")
      const headerWords = normHeader.split(/\s+/).filter(w => w.length > 2);
      const varWordsSignificant = normVar.split(/\s+/).filter(w => w.length > 2);
      if (headerWords.length > 0 && varWordsSignificant.length > 0) {
        if (headerWords.some(hw => varWordsSignificant.includes(hw))) return true;
        if (varWordsSignificant.some(vw => headerWords.includes(vw))) return true;
      }
      
      return false;
    };
    
    // First, do direct matching for common columns (most reliable)
    // Use normalized comparison to handle spaces, hyphens, etc.
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const headerLower = header.toLowerCase().trim();
      const headerNormalized = normalize(header);
      
      // Direct match for "Employee" -> "name" (very aggressive)
      if (!columnMap.name) {
        // Check normalized version (removes all spaces/hyphens)
        if (headerNormalized.includes('employee') || 
            headerNormalized === 'employee' ||
            headerNormalized === 'emp' ||
            // Also check original (case-insensitive)
            headerLower === 'employee' || 
            headerLower.includes('employee') || 
            headerLower === 'emp' ||
            headerLower === 'name' ||
            headerLower.includes('name')) {
          columnMap.name = i;
          if (process.env.NODE_ENV === 'development') {
            try {
              logger.log(`Direct match: "name" to header "${header}" (index ${i}, normalized: "${headerNormalized}")`, 'Information');
            } catch (logError) {}
          }
          continue;
        }
      }
      
      // Direct match for "Email"
      if (!columnMap.email) {
        const emailNormalized = normalize(header);
        if (emailNormalized.includes('email') || 
            emailNormalized === 'email' ||
            headerLower === 'email' || 
            headerLower.includes('email') || 
            headerLower === 'e-mail' ||
            headerLower === 'e mail') {
          columnMap.email = i;
          if (process.env.NODE_ENV === 'development') {
            try {
              logger.log(`Direct match: "email" to header "${header}" (index ${i})`, 'Information');
            } catch (logError) {}
          }
          continue;
        }
      }
    }
    
    // Then do flexible matching for other columns
    Object.entries(expectedColumns).forEach(([key, variations]) => {
      // Skip if already matched
      if (columnMap[key] !== undefined) return;
      
      // Try each header
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        
        // Check against each variation
        for (const variation of variations) {
          if (matches(header, variation)) {
            columnMap[key] = i;
            // Log in development
            if (process.env.NODE_ENV === 'development') {
              try {
                logger.log(`Matched column "${key}" to header "${header}" (index ${i})`, 'Information');
              } catch (logError) {
                // Ignore logging errors
              }
            }
            break; // Found a match, move to next column type
          }
        }
        
        // If we found a match, stop checking this column type
        if (columnMap[key] !== undefined) break;
      }
    });

    // Fallback: If no name/email found, use first column as name (always use fallback if needed)
    // This makes the import more flexible and user-friendly
    if (!columnMap.email && !columnMap.name) {
      if (headers.length > 0) {
        columnMap.name = 0;
        if (process.env.NODE_ENV === 'development') {
          try {
            logger.log(`Fallback: Using first column "${headers[0]}" as name column`, 'Information');
          } catch (logError) {
            // Ignore logging errors
          }
        }
      } else {
        // No headers at all - this is a real error
        return NextResponse.json(
          { error: 'Excel file must have a header row with column names' },
          { status: 400 }
        );
      }
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      usersCreated: 0,
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

        // If user doesn't exist, create them automatically (inactive, needs to log in)
        if (!user) {
          try {
            // Generate a temporary email if not provided
            let userEmail = email;
            if (!userEmail && name) {
              // Create email from name (lowercase, replace spaces with dots, add domain)
              const emailBase = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
              userEmail = `${emailBase}@company.local`; // Temporary email, user should update on first login
            }
            
            if (!userEmail) {
              result.errors.push({
                row: rowNumber,
                field: 'email/name',
                message: 'Cannot create user: both email and name are missing'
              });
              result.failed++;
              continue;
            }

            // Check if email already exists (case-insensitive)
            const existingUser = await prisma.user.findFirst({
              where: {
                email: { equals: userEmail, mode: 'insensitive' }
              }
            });

            if (existingUser) {
              user = existingUser;
            } else {
              // Create new user with default password (needs to be reset on first login)
              const defaultPassword = 'TempPassword123!'; // User should reset on first login
              const hashedPassword = await bcrypt.hash(defaultPassword, 10);

              user = await prisma.user.create({
                data: {
                  name: name || userEmail.split('@')[0],
                  email: userEmail.trim(),
                  password: hashedPassword,
                  role: 'EMPLOYEE',
                  isActive: false, // Inactive until they log in and reset password
                  jobCategory: jobCategory || null,
                  designation: designation || null,
                }
              });

              result.usersCreated++;

              // Log user creation in development
              if (process.env.NODE_ENV === 'development') {
                try {
                  logger.log(`Auto-created user: ${user.name} (${user.email}) - inactive`, 'Information');
                } catch (logError) {
                  // Ignore logging errors
                }
              }
            }
          } catch (createError: any) {
            // If user creation fails, log error and skip row
            result.errors.push({
              row: rowNumber,
              field: 'user_creation',
              message: `Failed to create user: ${createError.message || 'Unknown error'}`
            });
            result.failed++;
            continue;
          }
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
