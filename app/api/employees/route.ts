import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Allow both ADMIN and MANAGER roles
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // For managers, only get their managed employees
    // For admins, get all employees
    const whereClause = session.user.role === Role.MANAGER 
      ? {
          managerId: session.user.id,
          role: Role.EMPLOYEE
        }
      : {
          role: Role.EMPLOYEE
        };

    // Get all relevant employees
    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        position: true,
        isActive: true,
        manager: {
          select: {
            name: true,
            email: true
          }
        },
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
      where: whereClause
    });

    // Get active employee count
    const activeEmployees = await prisma.user.count({
      where: {
        ...whereClause,
        isActive: true
      }
    });

    // Transform the data to include goal count, status, and manager info
    const employeesWithStats = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      isActive: emp.isActive,
      manager: emp.manager,
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