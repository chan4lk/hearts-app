import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

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
