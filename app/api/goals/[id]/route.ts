import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the goal to check ownership
    const goal = await prisma.goal.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        manager: true
      }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if user is authorized to delete the goal
    const isAdmin = session.user.role === 'ADMIN';
    const isManager = session.user.role === 'MANAGER';
    const isEmployee = session.user.role === 'EMPLOYEE';
    const isGoalManager = goal.managerId === session.user.id;
    const isGoalEmployee = goal.employeeId === session.user.id;

    if (!isAdmin && !isManager && !isEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isAdmin && !isGoalManager && !isGoalEmployee) {
      return NextResponse.json({ error: 'You are not authorized to delete this goal' }, { status: 403 });
    }

    // Delete the goal
    await prisma.goal.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete goal',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 