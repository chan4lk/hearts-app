import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch feedback for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycleId');
    const type = searchParams.get('type'); // 'to-give' or 'to-receive'

    if (!cycleId) {
      return NextResponse.json(
        { error: 'Cycle ID is required' },
        { status: 400 }
      );
    }

    let feedbacks;
    
    if (type === 'to-give') {
      // Feedback that the current user needs to give
      feedbacks = await prisma.feedback360.findMany({
        where: {
          cycleId,
          reviewerId: session.user.id,
          isCompleted: false
        },
        include: {
          cycle: {
            select: {
              id: true,
              name: true,
              endDate: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Feedback that the current user will receive
      feedbacks = await prisma.feedback360.findMany({
        where: {
          cycleId,
          employeeId: session.user.id
        },
        include: {
          cycle: {
            select: {
              id: true,
              name: true,
              endDate: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              position: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          competencyAssessments: {
            include: {
              competency: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              },
              level: {
                select: {
                  id: true,
                  level: true,
                  name: true,
                  description: true
                }
              }
            }
          },
          comments: {
            where: {
              OR: [
                { isPrivate: false },
                { 
                  feedback: {
                    OR: [
                      { employeeId: session.user.id },
                      { reviewerId: session.user.id }
                    ]
                  }
                }
              ]
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch feedback',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST - Submit feedback
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { 
      cycleId, 
      employeeId, 
      reviewerType, 
      isAnonymous, 
      competencyAssessments, 
      comments 
    } = body;

    if (!cycleId || !employeeId || !reviewerType || !competencyAssessments) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback360.findUnique({
      where: {
        cycleId_employeeId_reviewerId: {
          cycleId,
          employeeId,
          reviewerId: session.user.id
        }
      }
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this employee' },
        { status: 400 }
      );
    }

    // Create feedback with assessments and comments
    const feedback = await prisma.feedback360.create({
      data: {
        cycleId,
        employeeId,
        reviewerId: session.user.id,
        reviewerType,
        isAnonymous,
        isCompleted: true,
        submittedAt: new Date(),
        competencyAssessments: {
          create: competencyAssessments.map((assessment: any) => ({
            competencyId: assessment.competencyId,
            levelId: assessment.levelId,
            rating: assessment.rating,
            comments: assessment.comments
          }))
        },
        comments: {
          create: comments?.map((comment: any) => ({
            section: comment.section,
            content: comment.content,
            isPrivate: comment.isPrivate || false
          })) || []
        }
      },
      include: {
        cycle: {
          select: {
            id: true,
            name: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competencyAssessments: {
          include: {
            competency: {
              select: {
                id: true,
                name: true,
                category: true
              }
            },
            level: {
              select: {
                id: true,
                level: true,
                name: true
              }
            }
          }
        },
        comments: {
          select: {
            id: true,
            section: true,
            content: true,
            isPrivate: true
          }
        }
      }
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit feedback',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 