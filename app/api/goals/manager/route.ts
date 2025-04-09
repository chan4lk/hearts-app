import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'MANAGER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    const goals = await prisma.goal.findMany({
      where: {
        managerId: session.user.id,
        status: GoalStatus.APPROVED,
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        User_Goal_employeeIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        lastProgressUpdate: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 