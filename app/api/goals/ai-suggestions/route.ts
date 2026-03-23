import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateGoalSuggestions } from '@/lib/openai';
import { z } from 'zod';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Apply strict rate limiting for AI operations (expensive)
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { category, context } = validationResult.data;

    const suggestions = await generateGoalSuggestions(
      category,
      session.user.role,
      context
    );

    return NextResponse.json({ suggestions });
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 