export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
      select: {
        id: true,
      },
    });
    const employeeIds = employees.map(emp => emp.id);

    // Fetch only COMPLETED goals for rating:
    // 1. Manager-assigned goals (managerId = session.user.id)
    // 2. Employee self-created goals (createdById = employeeId AND managerId is null) for assigned employees
    // Only include COMPLETED status
    const goals = await prisma.goal.findMany({
      where: {
        OR: [
          // Manager-assigned goals
          {
            managerId: session.user.id,
          },
          // Employee self-created goals (for assigned employees only)
          {
            employeeId: { in: employeeIds },
            createdById: { in: employeeIds }, // Created by the employee themselves
            managerId: null, // Not assigned by a manager
          },
        ],
        status: 'COMPLETED', // Only COMPLETED goals
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rating: {
          select: {
            id: true,
            selfScore: true,
            selfComments: true,
            selfRatedById: true,
            managerScore: true,
            managerComments: true,
            managerRatedById: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Found goals:', goals); // Debug log

    // Transform the data to include ratings and all goal fields
    const goalsWithRatings = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      dueDate: goal.dueDate.toISOString(),
      category: goal.category,
      department: goal.department,
      priority: goal.priority,
      managerId: goal.managerId || '',
      isApprovalProcess: false, // Default value since this field doesn't exist in the database
      employee: goal.employee,
      manager: goal.manager,
      rating: goal.rating || null,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    }));

    console.log('Transformed goals:', goalsWithRatings); // Debug log
    return NextResponse.json(goalsWithRatings);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch goals',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, dueDate, category = 'PROFESSIONAL' } = body;

    if (!title || !description || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        status: GoalStatus.APPROVED, // Manager-assigned goals start as APPROVED (manager can approve their own goals immediately)
        employeeId: session.user.id, // Manager is both employee and manager
        managerId: session.user.id,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Add category to the response for frontend compatibility
    const goalWithCategory = {
      ...goal,
      category
    };

    return NextResponse.json(goalWithCategory);
  } catch (error) {
    console.error('Error creating manager goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
} 