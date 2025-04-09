import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoalStatus } from '@prisma/client';

export async function POST() {
  try {
    // Get the manager and employee
    const manager = await prisma.user.findFirst({
      where: { role: 'MANAGER' }
    });

    const employee = await prisma.user.findFirst({
      where: { role: 'EMPLOYEE' }
    });

    if (!manager || !employee) {
      return new NextResponse('Manager or employee not found', { status: 404 });
    }

    // Update employee's managerId
    await prisma.user.update({
      where: { id: employee.id },
      data: { managerId: manager.id }
    });

    // Create sample goals
    const goals = await Promise.all([
      prisma.goal.create({
        data: {
          title: "Complete Project A",
          description: "Implement core features for Project A",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: GoalStatus.APPROVED,
          employeeId: employee.id,
          managerId: manager.id,
        },
      }),
      prisma.goal.create({
        data: {
          title: "Learn New Technology",
          description: "Master React and Next.js framework",
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
          status: GoalStatus.APPROVED,
          employeeId: employee.id,
          managerId: manager.id,
        },
      }),
      prisma.goal.create({
        data: {
          title: "Improve Code Quality",
          description: "Implement better testing practices",
          dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
          status: GoalStatus.APPROVED,
          employeeId: employee.id,
          managerId: manager.id,
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Sample goals created successfully',
      goalsCreated: goals.length,
      employeeId: employee.id,
      managerId: manager.id
    });
  } catch (error) {
    console.error('Error seeding goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 