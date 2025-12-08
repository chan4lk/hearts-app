import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeGoalRisk } from '@/lib/openai';
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

    const { goalId } = await request.json();

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Get goal details
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        employee: {
          include: {
            goals: {
              where: {
                status: { in: ['PENDING', 'APPROVED', 'MODIFIED'] }
              }
            }
          }
        }
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check authorization
    if (goal.employeeId !== session.user.id && 
        goal.managerId !== session.user.id && 
        session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Analyze goal risk
    const riskAnalysis = await analyzeGoalRisk({
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.toISOString(),
      progress: goal.progress,
      category: goal.category,
      employeeWorkload: goal.employee.goals.length
    });

    return NextResponse.json({
      success: true,
      goalId: goal.id,
      goalTitle: goal.title,
      analysis: riskAnalysis
    });

  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

