import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all ratings where the user submitted a self-rating or manager-rating
    const ratings = await prisma.rating.findMany({
      where: {
        OR: [
          { selfRatedById: session.user.id },
          { managerRatedById: session.user.id }
        ]
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            status: true,
            employeeId: true,
            managerId: true,
          }
        },
        selfRatedBy: {
          select: { id: true, name: true, email: true }
        },
        managerRatedBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Format response with clear separation of self and manager ratings
    const formattedRatings = ratings.map(r => ({
      id: r.id,
      goalId: r.goalId,
      goal: r.goal,
      // Self rating info
      selfScore: r.selfScore,
      selfComments: r.selfComments,
      selfRatedBy: r.selfRatedBy,
      selfRatedAt: r.selfRatedAt,
      // Manager rating info
      managerScore: r.managerScore,
      managerComments: r.managerComments,
      managerRatedBy: r.managerRatedBy,
      managerRatedAt: r.managerRatedAt,
      // Meta
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({ ratings: formattedRatings });
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}