import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = params;
    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, description, dueDate, employeeId, category, status } = body;

    // Validate required fields
    if (!title || !description || !dueDate || !employeeId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { 
        employee: true,
        manager: true
      }
    });

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // For managers, check if they are the manager of the employee
    if (session.user.role === 'MANAGER') {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { managerId: true }
      });

      if (!employee || employee.managerId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only update goals for your assigned employees' },
          { status: 403 }
        );
      }
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        employeeId,
        category,
        status: status || existingGoal.status,
        updatedAt: new Date()
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

    if (!updatedGoal) {
      return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }

    // Return the updated goal with all necessary fields
    return NextResponse.json({
      id: updatedGoal.id,
      title: updatedGoal.title,
      description: updatedGoal.description,
      dueDate: updatedGoal.dueDate.toISOString(),
      category: updatedGoal.category,
      status: updatedGoal.status,
      employee: updatedGoal.employee,
      manager: updatedGoal.manager
    });

  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 