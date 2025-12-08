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

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        status: 'APPROVED',
        employeeId: session.user.id,
      },
      include: {
        rating: {
          select: {
            id: true,
            selfScore: true,
            selfComments: true,
            managerScore: true,
            managerComments: true,
            selfRatedBy: {
              select: { id: true, name: true, email: true },
            },
            managerRatedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 