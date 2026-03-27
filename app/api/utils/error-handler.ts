// TODO: Standardize API response format across all endpoints.
// All responses should follow a consistent shape, e.g.:
//   Success: { success: true, data: T }
//   Error:   { success: false, error: { message: string, code?: string } }
// This requires updating all API routes to use a shared response builder.
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// ID validation for route params — supports both CUID and UUID formats
const CUID_REGEX = /^c[a-z0-9]{20,32}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates an ID param (CUID or UUID) and returns a JSON 400 response if invalid.
 * Returns null if valid (caller should proceed).
 */
export function validateUUID(id: string, paramName = 'ID'): NextResponse | null {
  if (!id || (!CUID_REGEX.test(id) && !UUID_REGEX.test(id))) {
    return NextResponse.json(
      { error: `Invalid ${paramName} format` },
      { status: 400 }
    );
  }
  return null;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  logger.error(
    error instanceof Error ? error : new Error(String(error))
  );

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
