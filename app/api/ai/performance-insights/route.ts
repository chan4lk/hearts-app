import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePerformanceInsights } from '@/lib/openai';
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

    const { userId } = await request.json();
    const targetUserId = userId || session.user.id;

    // Check authorization
    if (targetUserId !== session.user.id && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user's goals and performance data (limited to last 200 for performance)
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        goals: {
          where: {
            status: { not: 'DELETED' }
          },
          include: {
            rating: {
              select: { selfScore: true, managerScore: true }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 200
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate performance metrics
    const totalGoals = user.goals.length;
    const completedGoals = user.goals.filter(g => g.status === 'COMPLETED').length;
    const pendingGoals = user.goals.filter(g =>
      ['PENDING', 'APPROVED', 'MODIFIED'].includes(g.status)
    ).length;

    // Get ratings (prefer manager score, fallback to self score)
    const goalsWithRatings = user.goals.filter(g => g.rating?.managerScore != null || g.rating?.selfScore != null);
    const ratingScores = goalsWithRatings.map(g => g.rating?.managerScore ?? g.rating?.selfScore ?? 0);
    const averageRating = ratingScores.length > 0
      ? ratingScores.reduce((sum, r) => sum + r, 0) / ratingScores.length
      : 0;

    // Goals by category
    const goalsByCategory: { [key: string]: number } = {};
    user.goals.forEach(goal => {
      goalsByCategory[goal.category] = (goalsByCategory[goal.category] || 0) + 1;
    });

    // Determine trend (simple heuristic based on recent goals)
    const recentGoals = user.goals.slice(0, 5);
    const recentCompletionRate = recentGoals.length > 0
      ? recentGoals.filter(g => g.status === 'COMPLETED').length / recentGoals.length
      : 0;
    const overallCompletionRate = totalGoals > 0 ? completedGoals / totalGoals : 0;
    
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentCompletionRate > overallCompletionRate + 0.1) {
      recentTrend = 'improving';
    } else if (recentCompletionRate < overallCompletionRate - 0.1) {
      recentTrend = 'declining';
    }

    // Generate AI insights
    const insights = await generatePerformanceInsights({
      totalGoals,
      completedGoals,
      pendingGoals,
      averageRating,
      goalsByCategory,
      recentTrend
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      metrics: {
        totalGoals,
        completedGoals,
        pendingGoals,
        averageRating: averageRating.toFixed(1),
        completionRate: ((completedGoals / totalGoals) * 100).toFixed(1),
        recentTrend
      },
      insights
    });

  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

