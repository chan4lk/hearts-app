import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.goalId;

    // Get all ratings for the goal
    const ratings = await prisma.rating.findMany({
      where: {
        goalId
      },
      include: {
        selfRatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        managerRatedBy: {
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

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goalId = params.goalId;
    const body = await request.json();
    const { score, comments } = body;

    if (!score || typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid rating score' },
        { status: 400 }
      );
    }

    // Check if the user has already rated this goal
    const existingRating = await prisma.rating.findFirst({
      where: {
        goalId,
        selfRatedById: session.user.id
      }
    });

    let rating;
    if (existingRating) {
      // Update existing rating
      rating = await prisma.rating.update({
        where: { id: existingRating.id },
        data: {
          score,
          comments,
          updatedAt: new Date()
        },
        include: {
          selfRatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          managerRatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      // Create new rating
      rating = await prisma.rating.create({
        data: {
          score,
          comments,
          goalId,
          selfRatedById: session.user.id
        },
        include: {
          selfRatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          managerRatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }

    return NextResponse.json(rating);
  } catch (error) {
    console.error('Error creating/updating rating:', error);
    return NextResponse.json(
      { error: 'Failed to create/update rating' },
      { status: 500 }
    );
  }
} 