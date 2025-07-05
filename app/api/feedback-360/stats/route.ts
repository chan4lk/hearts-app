import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');

    // Base query conditions
    const baseConditions: any = {};
    if (cycleId) {
      baseConditions.cycleId = cycleId;
    }

    // Role-based filtering
    if (session.user.role === 'EMPLOYEE') {
      // Employees can only see their own feedback stats
      baseConditions.OR = [
        { employeeId: session.user.id },
        { reviewerId: session.user.id }
      ];
    } else if (session.user.role === 'MANAGER') {
      // Managers can see stats for their team
      const teamMembers = await prisma.user.findMany({
        where: { managerId: session.user.id },
        select: { id: true }
      });
      const teamMemberIds = teamMembers.map(member => member.id);
      
      baseConditions.OR = [
        { employeeId: { in: teamMemberIds } },
        { reviewerId: session.user.id },
        { employeeId: session.user.id }
      ];
    }
    // Admins can see all stats (no additional filtering)

    // Get feedback cycles stats
    const cyclesStats = await prisma.feedbackCycle.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const totalCycles = await prisma.feedbackCycle.count();
    const activeCycles = cyclesStats.find(stat => stat.status === 'ACTIVE')?._count.id || 0;

    // Get feedback completion stats
    const totalFeedbacks = await prisma.feedback360.count({
      where: baseConditions
    });

    const completedFeedbacks = await prisma.feedback360.count({
      where: {
        ...baseConditions,
        isCompleted: true
      }
    });

    const averageCompletionRate = totalFeedbacks > 0 
      ? Math.round((completedFeedbacks / totalFeedbacks) * 100)
      : 0;

    // Get average ratings
    const ratingStats = await prisma.competencyAssessment.aggregate({
      where: {
        feedback: {
          ...baseConditions
        }
      },
      _avg: {
        rating: true
      }
    });

    const averageRating = ratingStats._avg.rating || 0;

    // Get competency breakdown
    const competencyStats = await prisma.competencyAssessment.groupBy({
      by: ['competencyId'],
      where: {
        feedback: {
          ...baseConditions
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    // Get reviewer type breakdown
    const reviewerTypeStats = await prisma.feedback360.groupBy({
      by: ['reviewerType'],
      where: baseConditions,
      _count: {
        id: true
      }
    });

    // Get recent activity
    const recentFeedbacks = await prisma.feedback360.findMany({
      where: baseConditions,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            position: true
          }
        },
        cycle: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get department breakdown (if admin)
    let departmentStats = null;
    if (session.user.role === 'ADMIN') {
      departmentStats = await prisma.feedback360.groupBy({
        by: ['employeeId'],
        where: baseConditions,
        _count: {
          id: true
        }
      });
    }

    const stats = {
      totalCycles,
      activeCycles,
      totalFeedbacks,
      completedFeedbacks,
      averageCompletionRate,
      averageRating,
      competencyStats: competencyStats.map(stat => ({
        competencyId: stat.competencyId,
        averageRating: stat._avg.rating || 0,
        totalAssessments: stat._count.id
      })),
      reviewerTypeStats: reviewerTypeStats.map(stat => ({
        reviewerType: stat.reviewerType,
        count: stat._count.id
      })),
      recentFeedbacks: recentFeedbacks.map(feedback => ({
        id: feedback.id,
        employeeName: feedback.employee.name,
        employeePosition: feedback.employee.position,
        reviewerName: feedback.reviewer?.name || 'Anonymous',
        reviewerType: feedback.reviewerType,
        cycleName: feedback.cycle.name,
        status: feedback.isCompleted ? 'COMPLETED' : 'PENDING',
        createdAt: feedback.createdAt
      })),
      departmentStats
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback statistics' },
      { status: 500 }
    );
  }
} 