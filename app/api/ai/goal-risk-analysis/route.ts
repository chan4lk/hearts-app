import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeGoalRisk } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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
    console.error('Error analyzing goal risk:', error);
    return NextResponse.json(
      { error: 'Failed to analyze goal risk' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

