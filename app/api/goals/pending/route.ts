import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { GoalStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // First get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    const employeeIds = employees.map(emp => emp.id);

    // Then fetch pending goals for these employees
    const goals = await prisma.goal.findMany({
      where: {
        status: GoalStatus.PENDING,
        employeeId: {
          in: employeeIds,
        },
      },
      include: {
        User_Goal_employeeIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching pending goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 