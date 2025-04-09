import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log

    if (!session?.user || session.user.role !== 'MANAGER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
    });
    console.log('Found employees:', employees); // Debug log

    const employeeIds = employees.map(emp => emp.id);
    console.log('Employee IDs:', employeeIds); // Debug log

    // Fetch goals for all managed employees
    const goals = await prisma.goal.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        status: GoalStatus.APPROVED,
      },
      include: {
        User_Goal_employeeIdToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ratings: {
          select: {
            id: true,
            score: true,
            comments: true,
            managerRatedById: true,
          },
          where: {
            managerRatedById: session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Found goals:', goals); // Debug log

    // Transform the data to include ratings
    const goalsWithRatings = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      dueDate: goal.dueDate,
      employee: goal.User_Goal_employeeIdToUser,
      rating: goal.ratings[0] || null,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }));

    console.log('Transformed goals:', goalsWithRatings); // Debug log
    return NextResponse.json(goalsWithRatings);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 