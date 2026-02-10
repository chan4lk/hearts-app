import { z } from 'zod';
import { validatePasswordStrength } from './securityUtils';

/**
 * VALIDATION SCHEMAS - Add to lib/validation.ts or use directly in endpoints
 * These schemas prevent SQL injection, XSS, and data type errors
 */

// ============================================
// PASSWORD VALIDATION (used by admin/users, users, password API routes)
// ============================================

/**
 * Validate password strength. Returns { valid, error } for API responses.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  const result = validatePasswordStrength(password);
  return {
    valid: result.isValid,
    error: result.isValid ? undefined : result.errors.join(' '),
  };
}

// ============================================
// GOAL ENDPOINTS VALIDATION
// ============================================

export const createGoalSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  category: z.enum([
    'PROFESSIONAL',
    'TECHNICAL',
    'LEADERSHIP',
    'PERSONAL',
    'TRAINING',
    'KPI',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  dueDate: z.string().datetime('Invalid date format'),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum([
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'MODIFIED',
    'COMPLETED',
    'IN_PROGRESS',
    'ON_HOLD',
    'BLOCKED',
  ]).optional(),
  progress: z
    .number()
    .min(0, 'Progress must be 0 or more')
    .max(100, 'Progress must be 100 or less')
    .optional(),
});

export const goalQuerySchema = z.object({
  page: z
    .string()
    .pipe(z.coerce.number().min(1, 'Page must be 1 or greater'))
    .default('1'),
  limit: z
    .string()
    .pipe(z.coerce.number().min(1, 'Limit must be 1 or greater').max(100, 'Limit cannot exceed 100'))
    .default('20'),
  status: z.enum([
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'MODIFIED',
    'COMPLETED',
    'IN_PROGRESS',
    'ON_HOLD',
    'BLOCKED',
  ]).optional(),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'progress', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z
    .string()
    .max(100, 'Search term too long')
    .optional(),
});

// ============================================
// USER MANAGEMENT VALIDATION
// ============================================

export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name too long')
    .optional(),
  role: z
    .enum(['ADMIN', 'MANAGER', 'EMPLOYEE'])
    .optional(),
  department: z
    .string()
    .max(100, 'Department name too long')
    .optional(),
  managerId: z
    .string()
    .min(1, 'Manager ID required if provided')
    .optional()
    .nullable(),
  isActive: z
    .boolean()
    .optional(),
});

export const userSearchSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .trim(),
  limit: z
    .string()
    .pipe(z.coerce.number().min(1).max(50).default(10))
    .default('10'),
  role: z
    .enum(['ADMIN', 'MANAGER', 'EMPLOYEE'])
    .optional(),
});

// ============================================
// RATING VALIDATION
// ============================================

export const createRatingSchema = z.object({
  goalId: z
    .string()
    .min(1, 'Goal ID required'),
  selfScore: z
    .number()
    .min(1, 'Score must be 1 or higher')
    .max(5, 'Score must be 5 or lower')
    .optional(),
  selfComments: z
    .string()
    .max(1000, 'Comments too long')
    .optional(),
  managerScore: z
    .number()
    .min(1, 'Score must be 1 or higher')
    .max(5, 'Score must be 5 or lower')
    .optional(),
  managerComments: z
    .string()
    .max(1000, 'Comments too long')
    .optional(),
});

// ============================================
// NOTIFICATION VALIDATION
// ============================================

export const notificationQuerySchema = z.object({
  page: z
    .string()
    .pipe(z.coerce.number().min(1))
    .default('1'),
  limit: z
    .string()
    .pipe(z.coerce.number().min(1).max(50))
    .default('20'),
  isRead: z
    .string()
    .pipe(z.coerce.boolean())
    .optional(),
});

// ============================================
// HELPER FUNCTION TO USE IN API ROUTES
// ============================================

/**
 * Validate request body against schema
 * Returns { valid: boolean, data?: T, errors?: ZodIssue[] }
 */
export function validateRequest<T>(
  schema: z.ZodSchema,
  data: unknown
): { valid: boolean; data?: T; errors?: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues,
    };
  }
  
  return {
    valid: true,
    data: result.data as T,
  };
}

/**
 * Example: How to use in an API route
 * 
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *   
 *   const validation = validateRequest(createGoalSchema, body);
 *   if (!validation.valid) {
 *     return Response.json(
 *       { error: 'Validation failed', details: validation.errors },
 *       { status: 400 }
 *     );
 *   }
 *   
 *   const goalData = validation.data;
 *   // Safe to use goalData - guaranteed to match schema
 * }
 */
