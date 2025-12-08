import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { improveFeedback } from '@/lib/openai';
import { rateLimiters } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for AI operations (expensive)
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, type, tone } = await request.json();

    if (!text || !type) {
      return NextResponse.json(
        { error: 'Text and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['manager_comment', 'self_rating', 'goal_description'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    const validTones = ['constructive', 'encouraging', 'professional'];
    const selectedTone = tone && validTones.includes(tone) ? tone : 'professional';

    // Improve the feedback using AI
    const improvedText = await improveFeedback(text, {
      type: type as 'manager_comment' | 'self_rating' | 'goal_description',
      tone: selectedTone as 'constructive' | 'encouraging' | 'professional'
    });

    return NextResponse.json({
      success: true,
      original: text,
      improved: improvedText,
      type,
      tone: selectedTone
    });

  } catch (error) {
    console.error('Error improving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to improve feedback' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

