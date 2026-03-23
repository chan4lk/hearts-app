import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePersonalizedGoals } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

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

    const { count = 5 } = await request.json();

    // Get user profile and performance data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        goals: {
          where: {
            status: { not: 'DELETED' }
          },
          include: {
            rating: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate performance metrics
    const totalGoals = user.goals.length;
    const completedGoals = user.goals.filter(g => g.status === 'COMPLETED').length;
    const currentGoals = user.goals.filter(g =>
      ['PENDING', 'APPROVED', 'MODIFIED'].includes(g.status)
    ).length;

    // Get ratings (prefer manager score, fallback to self score)
    const goalsWithRatings = user.goals.filter(g => g.rating?.managerScore != null || g.rating?.selfScore != null);
    const ratingScores = goalsWithRatings.map(g => g.rating?.managerScore ?? g.rating?.selfScore ?? 0);
    const averageRating = ratingScores.length > 0
      ? ratingScores.reduce((sum, r) => sum + r, 0) / ratingScores.length
      : 0;

    // Generate personalized goals
    const suggestions = await generatePersonalizedGoals({
      role: user.role,
      department: user.department || 'General',
      position: user.position || undefined,
      currentGoals,
      completedGoals,
      averageRating
    }, count);

    return NextResponse.json({
      success: true,
      suggestions,
      userProfile: {
        currentGoals,
        completedGoals,
        totalGoals,
        averageRating: averageRating.toFixed(1)
      }
    });

  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

