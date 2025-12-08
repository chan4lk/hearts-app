import { NextRequest, NextResponse } from 'next/server';
import { generateGoalSuggestions } from '@/lib/openai';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    // Apply strict rate limiting for AI operations (expensive)
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { prompt, category } = await req.json();

    if (!prompt || !category) {
      return NextResponse.json(
        { error: 'Prompt and category are required' },
        { status: 400 }
      );
    }

    // Use the OpenAI helper to generate goals
    const goals = await generateGoalSuggestions(category, 'employee', prompt);
    if (!goals || goals.length === 0) {
      return NextResponse.json({ error: 'No goals generated' }, { status: 500 });
    }
    return NextResponse.json(goals[0]);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 