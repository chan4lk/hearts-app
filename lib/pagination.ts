/**
 * Pagination utilities and constants
 * Ensures consistent pagination limits across all API routes
 */

// Maximum pagination limits for different resource types
export const PAGINATION_LIMITS = {
  // Standard pagination limits
  DEFAULT: 20,        // Default items per page
  MAX_STANDARD: 100,  // Maximum for standard lists (goals, users, etc.)
  MAX_LARGE: 500,     // Maximum for large datasets (with special permission)
  MAX_MINIMAL: 1000,  // Maximum for minimal mode (dropdowns, autocomplete)
  
  // Resource-specific limits
  GOALS: 100,         // Goals list
  USERS: 100,         // Users list (normal mode)
  USERS_MINIMAL: 1000, // Users list (minimal mode for dropdowns)
  NOTIFICATIONS: 50,  // Notifications (smaller, more frequent)
  ACTIVITIES: 200,    // Activity logs
  REVIEW_CYCLES: 100, // Review cycles
  ANALYTICS: 100,     // Analytics data
} as const;

/**
 * Validate and normalize pagination parameters
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit for this resource type
 * @returns Normalized pagination parameters
 */
export function normalizePagination(
  page: number | string | null | undefined,
  limit: number | string | null | undefined,
  maxLimit: number = PAGINATION_LIMITS.MAX_STANDARD
): {
  page: number;
  limit: number;
  skip: number;
} {
  // Normalize page
  const pageNum = page 
    ? Math.max(1, parseInt(String(page), 10) || 1)
    : 1;

  // Normalize limit
  const limitNum = limit
    ? Math.min(maxLimit, Math.max(1, parseInt(String(limit), 10) || PAGINATION_LIMITS.DEFAULT))
    : PAGINATION_LIMITS.DEFAULT;

  // Calculate skip
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

/**
 * Get pagination metadata for response
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Validate pagination parameters from URL search params
 */
export function getPaginationFromSearchParams(
  searchParams: URLSearchParams,
  maxLimit: number = PAGINATION_LIMITS.MAX_STANDARD
): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  
  return normalizePagination(page, limit, maxLimit);
}
