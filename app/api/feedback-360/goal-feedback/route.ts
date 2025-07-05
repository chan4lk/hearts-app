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
    const goalId = searchParams.get('goalId');
    const cycleId = searchParams.get('cycleId');

    // Get user's goals
    const userGoals = await prisma.goal.findMany({
      where: { 
        employeeId: session.user.id,
        ...(goalId && { id: goalId })
      },
      include: {
        feedbackCycles: {
          include: {
            competencies: true,
            _count: {
              select: {
                feedbacks: true
              }
            }
          }
        },
        ratings: {
          include: {
            selfRatedBy: {
              select: {
                id: true,
                name: true
              }
            },
            managerRatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get feedback cycles related to user's goals
    const goalFeedbackCycles = await prisma.feedbackCycle.findMany({
      where: {
        OR: [
          { goalId: { in: userGoals.map(g => g.id) } },
          { goalCategory: { in: userGoals.map(g => g.category) } },
          { 
            AND: [
              { goalId: null },
              { goalCategory: null }
            ]
          }
        ],
        ...(cycleId && { id: cycleId })
      },
      include: {
        competencies: true,
        feedbacks: {
          where: {
            employeeId: session.user.id
          },
          include: {
            competencyAssessments: {
              include: {
                competency: true,
                level: true
              }
            },
            comments: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            feedbacks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get feedback received for each goal
    const goalFeedbackData = await Promise.all(
      userGoals.map(async (goal) => {
        // Get feedback cycles specifically for this goal
        const goalCycles = goalFeedbackCycles.filter(cycle => 
          cycle.goalId === goal.id || 
          cycle.goalCategory === goal.category ||
          (cycle.goalId === null && cycle.goalCategory === null)
        );

        // Get feedback received for this goal
        const feedbackReceived = await prisma.feedback360.findMany({
          where: {
            employeeId: session.user.id,
            cycle: {
              OR: [
                { goalId: goal.id },
                { goalCategory: goal.category },
                { goalId: null, goalCategory: null }
              ]
            }
          },
          include: {
            cycle: {
              select: {
                id: true,
                name: true,
                type: true
              }
            },
            competencyAssessments: {
              include: {
                competency: true,
                level: true
              }
            },
            comments: true,
            reviewer: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Calculate average ratings for this goal
        const competencyRatings = feedbackReceived.reduce((acc, feedback) => {
          feedback.competencyAssessments.forEach(assessment => {
            if (!acc[assessment.competency.name]) {
              acc[assessment.competency.name] = {
                total: 0,
                count: 0,
                competency: assessment.competency
              };
            }
            acc[assessment.competency.name].total += assessment.rating;
            acc[assessment.competency.name].count += 1;
          });
          return acc;
        }, {} as Record<string, any>);

        // Calculate averages
        Object.keys(competencyRatings).forEach(competency => {
          competencyRatings[competency].average = 
            competencyRatings[competency].total / competencyRatings[competency].count;
        });

        return {
          goal: {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: goal.category,
            status: goal.status,
            progress: goal.progress,
            dueDate: goal.dueDate,
            createdAt: goal.createdAt
          },
          feedbackCycles: goalCycles.map(cycle => ({
            id: cycle.id,
            name: cycle.name,
            type: cycle.type,
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            competencies: cycle.competencies,
            totalAssignments: cycle._count.feedbacks,
            completedFeedbacks: cycle.feedbacks.filter(f => f.isCompleted).length
          })),
          feedbackReceived: feedbackReceived.map(feedback => ({
            id: feedback.id,
            cycleName: feedback.cycle.name,
            reviewerType: feedback.reviewerType,
            reviewerName: feedback.isAnonymous ? 'Anonymous' : feedback.reviewer.name,
            reviewerRole: feedback.reviewer.role,
            isCompleted: feedback.isCompleted,
            submittedAt: feedback.submittedAt,
            competencyAssessments: feedback.competencyAssessments.map(assessment => ({
              competency: assessment.competency.name,
              level: assessment.level.name,
              rating: assessment.rating,
              comments: assessment.comments
            })),
            comments: feedback.comments.map(comment => ({
              section: comment.section,
              content: comment.content,
              isPrivate: comment.isPrivate
            }))
          })),
          competencySummary: competencyRatings,
          totalFeedbackCount: feedbackReceived.length,
          completedFeedbackCount: feedbackReceived.filter(f => f.isCompleted).length
        };
      })
    );

    // Get overall feedback statistics
    const overallStats = {
      totalGoals: userGoals.length,
      goalsWithFeedback: goalFeedbackData.filter(g => g.totalFeedbackCount > 0).length,
      totalFeedbackCycles: goalFeedbackCycles.length,
      totalFeedbackReceived: goalFeedbackData.reduce((sum, g) => sum + g.totalFeedbackCount, 0),
      completedFeedback: goalFeedbackData.reduce((sum, g) => sum + g.completedFeedbackCount, 0)
    };

    return NextResponse.json({
      goals: goalFeedbackData,
      overallStats,
      goalFeedbackCycles: goalFeedbackCycles.map(cycle => ({
        id: cycle.id,
        name: cycle.name,
        type: cycle.type,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        goalId: cycle.goalId,
        goalCategory: cycle.goalCategory,
        competencies: cycle.competencies,
        totalAssignments: cycle._count.feedbacks,
        userFeedbacks: cycle.feedbacks
      }))
    });

  } catch (error) {
    console.error('Error fetching goal feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal feedback' },
      { status: 500 }
    );
  }
} 