import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET: Generate complete employee review report
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Authorization: MANAGER, ADMIN, or the employee themselves
    const isSelf = session.user.id === employeeId;
    const isManagerOrAdmin = session.user.role === 'MANAGER' || session.user.role === 'ADMIN';

    if (!isSelf && !isManagerOrAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this employee review report' },
        { status: 403 }
      );
    }

    // Fetch the employee
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Fetch date of appointment from review cycle
    const reviewCycle = await prisma.reviewCycle.findUnique({
      where: { userId: employeeId },
      select: { dateOfAppointment: true }
    });

    // Fetch all goals for this employee with ratings
    const goals = await prisma.goal.findMany({
      where: {
        employeeId,
        status: { not: 'DELETED' }
      },
      include: {
        rating: {
          select: {
            id: true,
            selfScore: true,
            selfComments: true,
            selfRatedAt: true,
            managerScore: true,
            managerComments: true,
            managerRatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch all 360 feedback rounds for this employee with reviews
    const feedbackRounds = await prisma.feedbackRound.findMany({
      where: { employeeId },
      include: {
        initiatedBy: {
          select: { id: true, name: true, email: true }
        },
        reviews: {
          include: {
            reviewer: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich feedback rounds with summary stats
    const feedbackRoundsWithSummary = feedbackRounds.map((round) => {
      const submittedReviews = round.reviews.filter(
        (r) => r.status === 'SUBMITTED'
      );
      const scores = submittedReviews
        .map((r) => r.score)
        .filter((s): s is number => s !== null);
      const averageScore =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null;

      return {
        ...round,
        summary: {
          totalReviews: round.reviews.length,
          submittedReviews: submittedReviews.length,
          averageScore
        }
      };
    });

    // Fetch all meeting minutes for this employee
    const meetings = await prisma.meetingMinutes.findMany({
      where: { employeeId },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Fetch all surveys for this employee
    const surveys = await prisma.employeeSurvey.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch any exit interviews for this employee
    const exitInterviews = await prisma.exitInterview.findMany({
      where: { employeeId },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;

    // Calculate average rating from manager scores across all goals
    const managerScores = goals
      .map((g) => g.rating?.managerScore)
      .filter((s): s is number => s !== null);
    const averageRating =
      managerScores.length > 0
        ? Math.round(
            (managerScores.reduce((a, b) => a + b, 0) / managerScores.length) * 100
          ) / 100
        : null;

    const feedbackRoundsCompleted = feedbackRounds.filter(
      (r) => r.status === 'COMPLETED'
    ).length;

    const report = {
      employee: {
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        dateOfAppointment: reviewCycle?.dateOfAppointment || null
      },
      goals,
      feedbackRounds: feedbackRoundsWithSummary,
      meetings,
      surveys,
      exitInterviews,
      summary: {
        totalGoals,
        completedGoals,
        averageRating,
        feedbackRoundsCompleted
      }
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
