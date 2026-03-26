import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';
import * as XLSX from 'xlsx';
import { rateLimiters } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

interface ExcelRow {
  [key: string]: any;
  'Employee Email'?: string;
  'Employee Name'?: string;
  'Email'?: string;
  'Name'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Reporting Person'?: string;
  'Reporting Person Email'?: string;
  'Job Category'?: string;
  'Designation'?: string;
  'Date of Appointment'?: string | Date;
  'After 6 Months'?: string;
  'Review Month'?: string;
  'Adjusted Review Month'?: string;
}

interface SkippedUserData {
  rowNumber: number;
  reason: string;
  excelData: Record<string, any>; // Raw Excel row data
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  skippedUsers: SkippedUserData[];
  importedUsers?: Array<{
    rowNumber: number;
    firstName: string;
    systemUserName: string;
    status: string;
  }>;
  errors?: string[];
  message?: string;
  reportData?: string; // Base64 encoded CSV report
}

export async function POST(req: NextRequest): Promise<NextResponse<ImportResult> | NextResponse> {
  try {
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          skippedUsers: [],
          errors: ['Unauthorized']
        },
        { status: 401 }
      );
    }

    // Get current logged-in user data
    const currentUser = session.user;

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          skippedUsers: [],
          errors: ['No file provided']
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          skippedUsers: [],
          errors: ['Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file.']
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file with better options for handling dates and empty cells
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellDates: true, // Parse dates as Date objects
      cellNF: false,   // Don't parse number formats
      cellText: false, // Use raw cell values
      raw: false       // Parse values (not raw strings)
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Parse with header row and handle empty rows
    // This will use the first row as headers and return array of objects
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: null, // Use null for empty cells instead of empty string
      raw: false,   // Parse values (not raw strings)
      blankrows: false // Skip completely empty rows
    }) as ExcelRow[];
    
    // Filter out completely empty rows
    const filteredData = data.filter(row => {
      // Check if row has any non-empty values
      return Object.values(row).some(value => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        (typeof value !== 'string' || value.trim() !== '')
      );
    });
    
    const finalData = filteredData.length > 0 ? filteredData : data;

    if (!finalData || finalData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          skippedUsers: [],
          errors: ['Excel file is empty or invalid. Please ensure the file contains data rows with headers.']
        },
        { status: 400 }
      );
    }

    // Log parsed data structure for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      logger.log(`Parsed ${finalData.length} rows from Excel file`, 'Information', {
        totalRows: finalData.length,
        firstRowKeys: Object.keys(finalData[0] || {}),
        sampleRow: finalData[0],
        allColumnNames: finalData.length > 0 ? Object.keys(finalData[0]) : []
      });
    }

    const skippedUsers: SkippedUserData[] = [];
    const importedUsers: Array<{ rowNumber: number; firstName: string; systemUserName: string; status: string }> = [];
    const errors: string[] = [];
    let importedCount = 0;

    // Process each row
    for (let i = 0; i < finalData.length; i++) {
      const row = finalData[i];
      
      // Get name from Excel - Try all possible column names
      let excelName = '';
      let isFullName = false;
      
      // First try specific "First Name" columns
      const firstNameFields = [
        row['First Name'],
        row['first name'],
        row['FirstName'],
        row['firstName'],
        row['FIRST NAME']
      ];
      
      for (const field of firstNameFields) {
        if (field && (typeof field === 'string' || typeof field === 'number')) {
          excelName = field.toString().trim();
          if (excelName && excelName !== 'undefined' && excelName !== 'null') {
            isFullName = false;
            break;
          }
        }
      }
      
      // If no first name found, try full name columns
      if (!excelName) {
        const fullNameFields = [
          row['Name'],
          row['name'],
          row['NAME'],
          row['Employee Name'],
          row['employee name'],
          row['EMPLOYEE NAME']
        ];
        
        for (const field of fullNameFields) {
          if (field && (typeof field === 'string' || typeof field === 'number')) {
            excelName = field.toString().trim();
            if (excelName && excelName !== 'undefined' && excelName !== 'null') {
              isFullName = true;
              break;
            }
          }
        }
      }
      
      // Validate name is provided
      if (!excelName || excelName === 'undefined' || excelName === 'null') {
        skippedUsers.push({
          rowNumber: i + 2,
          reason: 'First Name or Employee Name is missing or invalid',
          excelData: row
        });
        continue;
      }

      // Extract first name if we have full name (e.g., "Thilan Buddhika" → "Thilan")
      let searchName = excelName;
      if (isFullName && excelName.includes(' ')) {
        searchName = excelName.split(' ')[0]; // Get first word
      }

      // Check if user exists in the system by FIRST NAME
      let user = await prisma.user.findFirst({
        where: {
          name: {
            contains: searchName,
            mode: 'insensitive'
          },
          isActive: true // Only match active users
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });

      if (!user) {
        skippedUsers.push({
          rowNumber: i + 2,
          reason: `User with first name "${searchName}" (from "${excelName}") does not exist in the system or account is inactive`,
          excelData: row
        });
        continue;
      }

      try {
        // Get reporting person if provided - just import the name/value as-is without validation
        let reportingPersonId: string | null = null;
        const reportingPersonFields = [
          row['Reporting Person First Name'],
          row['Reporting Person Name'],
          row['Reporting Person'],
          row['reporting person first name'],
          row['reporting person name'],
          row['reporting person'],
          row['REPORTING PERSON FIRST NAME'],
          row['REPORTING PERSON NAME'],
          row['REPORTING PERSON'],
          row['Manager Name'],
          row['manager name'],
          row['MANAGER NAME']
        ];
        
        let reportingPersonName = '';
        for (const field of reportingPersonFields) {
          if (field && (typeof field === 'string' || typeof field === 'number')) {
            reportingPersonName = field.toString().trim();
            if (reportingPersonName && reportingPersonName !== 'undefined' && reportingPersonName !== 'null') {
              break;
            }
          }
        }
        
        // If reporting person name provided, try to find them by name, but DON'T fail if not found
        // This allows importing reporting person data even if not in system
        if (reportingPersonName && reportingPersonName !== 'undefined' && reportingPersonName !== 'null') {
          // Try to find reporting person by name
          const reportingPerson = await prisma.user.findFirst({
            where: {
              name: {
                contains: reportingPersonName,
                mode: 'insensitive'
              },
              isActive: true
            },
            select: { id: true }
          });
          
          // Set ID if found, otherwise leave as null (don't validate/fail)
          if (reportingPerson) {
            reportingPersonId = reportingPerson.id;
          }
          // If not found, just continue - reportingPersonId stays null
        }

        // Parse date of appointment - handle Excel date formats
        let dateOfAppointment: Date | null = null;
        const dateFields = [
          row['Date of Appointment'],
          row['date of appointment'],
          row['DATE OF APPOINTMENT'],
          row['Date Of Appointment']
        ];
        
        let dateStr: any = null;
        for (const field of dateFields) {
          if (field !== undefined && field !== null && field !== '') {
            dateStr = field;
            break;
          }
        }
        
        if (dateStr) {
          if (dateStr instanceof Date) {
            // Already a Date object (from XLSX parsing)
            dateOfAppointment = dateStr;
          } else if (typeof dateStr === 'number') {
            // Excel serial date number (days since 1900-01-01)
            // Excel incorrectly treats 1900 as a leap year, so we need to adjust
            const excelEpoch = new Date(1899, 11, 30); // Excel epoch is Dec 30, 1899
            const days = Math.floor(dateStr);
            const milliseconds = (dateStr - days) * 24 * 60 * 60 * 1000;
            dateOfAppointment = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000 + milliseconds);
            
            // Validate the date
            if (isNaN(dateOfAppointment.getTime())) {
              dateOfAppointment = null;
            }
          } else {
            const dateString = dateStr.toString().trim();
            if (dateString && dateString !== 'undefined' && dateString !== 'null') {
              // Try parsing as ISO date or common formats
              let parsedDate = new Date(dateString);
              
              // If invalid, try other formats
              if (isNaN(parsedDate.getTime())) {
                // Try Excel date format (MM/DD/YYYY or DD/MM/YYYY)
                const dateParts = dateString.split(/[\/\-\.]/);
                if (dateParts.length === 3) {
                  // Try MM/DD/YYYY format first
                  const month = parseInt(dateParts[0]) - 1;
                  const day = parseInt(dateParts[1]);
                  const year = parseInt(dateParts[2]);
                  
                  // Validate year (assume 4-digit or 2-digit)
                  let fullYear = year;
                  if (year < 100) {
                    fullYear = year < 50 ? 2000 + year : 1900 + year;
                  }
                  
                  parsedDate = new Date(fullYear, month, day);
                  
                  // If still invalid, try DD/MM/YYYY
                  if (isNaN(parsedDate.getTime())) {
                    parsedDate = new Date(fullYear, day - 1, month + 1);
                  }
                }
              }
              
              if (!isNaN(parsedDate.getTime())) {
                dateOfAppointment = parsedDate;
              }
            }
          }
        }

        // Helper function to safely get string value from row with fuzzy matching
        const getStringValue = (fieldNames: string[]): string | null => {
          // First try exact matches
          for (const fieldName of fieldNames) {
            const value = row[fieldName];
            if (value !== undefined && value !== null && value !== '') {
              const str = value.toString().trim();
              if (str.length > 0) {
                return str;
              }
            }
          }
          
          // Then try case-insensitive fuzzy matching
          const allKeys = Object.keys(row);
          const lowerFieldNames = fieldNames.map(f => f.toLowerCase().trim());
          
          for (const key of allKeys) {
            const lowerKey = key.toLowerCase().trim();
            // Remove spaces and special chars for comparison
            const normalizedKey = lowerKey.replace(/[\s\-_]/g, '');
            
            for (const fieldName of lowerFieldNames) {
              const normalizedFieldName = fieldName.replace(/[\s\-_]/g, '');
              if (normalizedKey === normalizedFieldName || normalizedKey.includes(normalizedFieldName) || normalizedFieldName.includes(normalizedKey)) {
                const value = row[key];
                if (value !== undefined && value !== null && value !== '') {
                  const str = value.toString().trim();
                  if (str.length > 0) {
                    return str;
                  }
                }
              }
            }
          }
          
          return null;
        };

        // Prepare review cycle data with proper null handling
        const jobCategory = getStringValue(['Job Category', 'job category', 'JOB CATEGORY', 'JobCategory']);
        const designation = getStringValue(['Designation', 'designation', 'DESIGNATION']);
        const after6Months = getStringValue(['After 6 Months', 'after 6 months', 'AFTER 6 MONTHS', 'After6Months']);
        const reviewMonth = getStringValue(['Review Month', 'review month', 'REVIEW MONTH', 'ReviewMonth']);
        const adjustedReviewMonth = getStringValue(['Adjusted Review Month', 'adjusted review month', 'ADJUSTED REVIEW MONTH', 'AdjustedReviewMonth']);

        const reviewCycleData = {
          userId: user.id,
          reportingPersonId: reportingPersonId,
          jobCategory: jobCategory,
          designation: designation,
          dateOfAppointment: dateOfAppointment,
          after6Months: after6Months,
          reviewMonth: reviewMonth,
          adjustedReviewMonth: adjustedReviewMonth,
          updatedById: currentUser.id
        };

        // Validate that we have at least some data to import
        const hasData = jobCategory || designation || dateOfAppointment || after6Months || reviewMonth || adjustedReviewMonth || reportingPersonId;
        
        if (!hasData) {
          skippedUsers.push({
            rowNumber: i + 2,
            reason: 'No review cycle data provided in Excel row',
            excelData: row
          });
          continue;
        }

        // Upsert review cycle (create or update) with transaction
        try {
          const result = await prisma.reviewCycle.upsert({
            where: { userId: user.id },
            update: {
              reportingPersonId: reviewCycleData.reportingPersonId,
              jobCategory: reviewCycleData.jobCategory,
              designation: reviewCycleData.designation,
              dateOfAppointment: reviewCycleData.dateOfAppointment,
              after6Months: reviewCycleData.after6Months,
              reviewMonth: reviewCycleData.reviewMonth,
              adjustedReviewMonth: reviewCycleData.adjustedReviewMonth,
              updatedById: reviewCycleData.updatedById,
              updatedAt: new Date()
            },
            create: reviewCycleData,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true
                }
              }
            }
          });

          // Verify the record was actually created/updated
          if (!result || !result.id) {
            throw new Error('Failed to create/update review cycle - no result returned');
          }

          importedCount++;
          
          // Track imported user for report
          importedUsers.push({
            rowNumber: i + 2,
            firstName: excelName,
            systemUserName: user.name,
            status: 'IMPORTED'
          });
          
          // Log successful import for debugging
          logger.log(`Successfully imported review cycle for user: ${user.email}`, 'Information', {
            reviewCycleId: result.id,
            userId: user.id,
            jobCategory: reviewCycleData.jobCategory || 'null',
            designation: reviewCycleData.designation || 'null',
            reviewMonth: reviewCycleData.reviewMonth || 'null',
            dateOfAppointment: reviewCycleData.dateOfAppointment ? reviewCycleData.dateOfAppointment.toISOString() : 'null'
          });
        } catch (dbError) {
          // Database error - likely constraint violation or data issue
          const dbErrorMessage = dbError instanceof Error ? dbError.message : 'Database error';
          logger.error(new Error(`Database error importing review cycle for ${user.email}: ${dbErrorMessage}`));
          throw new Error(`Failed to save review cycle: ${dbErrorMessage}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Row ${i + 2} (${excelName}): ${errorMessage}`);
        logger.error(error instanceof Error ? error : new Error(String(error)));
        
        // Also add to skipped users for visibility
        skippedUsers.push({
          rowNumber: i + 2,
          reason: `Import error: ${errorMessage}`,
          excelData: row
        });
      }
    }

    // Log final results
    logger.log(`Import completed: ${importedCount} imported, ${skippedUsers.length} skipped`, 'Information', {
      imported: importedCount,
      skipped: skippedUsers.length,
      errors: errors.length,
      totalRows: finalData.length
    });

    // Build result message
    let message = '';
    if (importedCount > 0 && skippedUsers.length === 0) {
      message = `Successfully imported ${importedCount} review cycle(s)!`;
    } else if (importedCount > 0 && skippedUsers.length > 0) {
      message = `Imported ${importedCount} review cycle(s) successfully. ${skippedUsers.length} user(s) were skipped - download the report to see details.`;
    } else if (importedCount === 0 && skippedUsers.length > 0) {
      message = `No review cycles were imported. ${skippedUsers.length} user(s) were skipped. Please check the reasons and add missing users to the system.`;
    }

    // Generate CSV report - Simple format with Row Number, Employee Name, Status
    let csvReport = 'Row Number,Employee Name,Status\n';
    
    // Add imported users
    for (const user of importedUsers) {
      const employeeName = user.firstName; // Name from Excel
      const escapedName = `"${String(employeeName).replace(/"/g, '""')}"`;
      csvReport += `${user.rowNumber},${escapedName},IMPORTED\n`;
    }
    
    // Add skipped users
    for (const skip of skippedUsers) {
      // Get employee name from Excel data (try multiple field names)
      let employeeName = skip.excelData?.Name || 
                         skip.excelData?.['Employee Name'] || 
                         skip.excelData?.['First Name'] || 
                         'Unknown';
      const escapedName = `"${String(employeeName).replace(/"/g, '""')}"`;
      csvReport += `${skip.rowNumber},${escapedName},SKIPPED\n`;
    }
    
    // Encode CSV as base64
    const reportData = Buffer.from(csvReport).toString('base64');

    return NextResponse.json({
      success: importedCount > 0,
      imported: importedCount,
      skipped: skippedUsers.length,
      skippedUsers: skippedUsers,
      importedUsers: importedUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: message,
      reportData: reportData
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof Error && error.message.includes('file')) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          skippedUsers: [],
          errors: [error.message]
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        imported: 0,
        skipped: 0,
        skippedUsers: [],
        errors: ['Failed to process import file']
      },
      { status: 500 }
    );
  }
}

