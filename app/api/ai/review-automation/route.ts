import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePerformanceReview } from '@/lib/openai';
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

    // Only managers and admins can generate reviews
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, period } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user and their goals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: {
          where: {
            status: { not: 'DELETED' }
          },
          include: {
            rating: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if manager has access to this employee
    if (session.user.role === 'MANAGER') {
      const isManaging = user.goals.some(g => g.managerId === session.user.id);
      if (!isManaging && user.managerId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Prepare goals data for review
    const goalsData = user.goals.map(goal => ({
      title: goal.title,
      status: goal.status,
      rating: goal.rating?.managerScore ?? goal.rating?.selfScore ?? undefined,
      category: goal.category
    }));

    // Calculate strengths and improvements based on performance
    const completedGoals = user.goals.filter(g => g.status === 'COMPLETED');
    const highRatedGoals = completedGoals.filter(g => {
      // Use manager rating if available, otherwise self rating
      const ratingScore = g.rating?.managerScore ?? g.rating?.selfScore ?? 0;
      return ratingScore >= 4;
    });

    const strengths = highRatedGoals.length > 0
      ? highRatedGoals.slice(0, 3).map(g => g.title)
      : undefined;

    const lowRatedGoals = user.goals.filter(g => {
      const ratingScore = g.rating?.managerScore ?? g.rating?.selfScore ?? 0;
      return ratingScore < 3 && ratingScore > 0;
    });

    const improvements = lowRatedGoals.length > 0
      ? lowRatedGoals.slice(0, 3).map(g => g.title)
      : undefined;

    // Generate review
    const review = await generatePerformanceReview({
      name: user.name,
      role: user.role,
      period: period || 'Current Period',
      goals: goalsData,
      strengths,
      improvements
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      period: period || 'Current Period',
      review,
      metadata: {
        totalGoals: user.goals.length,
        completedGoals: completedGoals.length,
        highPerformingGoals: highRatedGoals.length
      }
    });

  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
