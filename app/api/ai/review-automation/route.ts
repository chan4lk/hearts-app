import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePerformanceReview } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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
            ratings: true
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
      rating: goal.ratings.length > 0
        ? goal.ratings.reduce((sum, r) => sum + r.score, 0) / goal.ratings.length
        : undefined,
      category: goal.category
    }));

    // Calculate strengths and improvements based on performance
    const completedGoals = user.goals.filter(g => g.status === 'COMPLETED');
    const highRatedGoals = completedGoals.filter(g => {
      const avgRating = g.ratings.length > 0
        ? g.ratings.reduce((sum, r) => sum + r.score, 0) / g.ratings.length
        : 0;
      return avgRating >= 4;
    });

    const strengths = highRatedGoals.length > 0
      ? highRatedGoals.slice(0, 3).map(g => g.title)
      : undefined;

    const lowRatedGoals = user.goals.filter(g => {
      const avgRating = g.ratings.length > 0
        ? g.ratings.reduce((sum, r) => sum + r.score, 0) / g.ratings.length
        : 0;
      return avgRating < 3 && avgRating > 0;
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
    console.error('Error generating performance review:', error);
    return NextResponse.json(
      { error: 'Failed to generate performance review' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
