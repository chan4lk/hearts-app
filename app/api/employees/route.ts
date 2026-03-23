import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

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

    // Run all queries in parallel
    const [employees, totalEmployees, activeEmployees] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          position: true,
          isActive: true,
          manager: {
            select: { name: true, email: true }
          },
          _count: {
            select: {
              goals: { where: { status: 'APPROVED' } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({ where: whereClause }),
      prisma.user.count({ where: { ...whereClause, isActive: true } })
    ]);

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
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 