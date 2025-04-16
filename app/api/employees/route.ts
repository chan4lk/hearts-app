import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get all employees managed by this manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true,
        isActive: true,
        _count: {
          select: {
            goals: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get total employee count (including inactive)
    const totalEmployees = await prisma.user.count({
      where: {
        managerId: session.user.id,
        role: 'EMPLOYEE'
      }
    });

    // Get active employee count
    const activeEmployees = await prisma.user.count({
      where: {
        managerId: session.user.id,
        role: 'EMPLOYEE',
        isActive: true
      }
    });

    // Transform the data to include goal count and status
    const employeesWithStats = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      isActive: emp.isActive,
      goalsCount: emp._count.goals
    }));

    return NextResponse.json({
      employees: employeesWithStats,
      totalCount: totalEmployees,
      activeCount: activeEmployees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch employees',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 