import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { goalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { progress, notes } = body;

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return new NextResponse('Invalid progress value', { status: 400 });
    }

    // Get the goal to check ownership
    const goal = await prisma.goal.findUnique({
      where: { id: params.goalId },
      select: { employeeId: true, managerId: true },
    });

    if (!goal) {
      return new NextResponse('Goal not found', { status: 404 });
    }

    if (goal.employeeId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Update the goal progress
    const updatedGoal = await prisma.goal.update({
      where: { id: params.goalId },
      data: {
        progress: progress,
        progressNotes: notes,
        lastProgressUpdate: new Date(),
      },
    });

    // Create notification for manager
    if (goal.managerId) {
      await prisma.notification.create({
        data: {
          type: 'GOAL_UPDATED',
          message: `Progress updated for goal: ${updatedGoal.title}`,
          userId: goal.managerId,
          goalId: updatedGoal.id,
        },
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 