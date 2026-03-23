import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateGoalSuggestions } from '@/lib/openai';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication (prevents anonymous OpenAI cost exposure)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 