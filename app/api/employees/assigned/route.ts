import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getPaginationFromSearchParams, getPaginationMeta, PAGINATION_LIMITS } from '@/lib/pagination';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get managerId from query params (for admin viewing specific manager's employees)
    const { searchParams } = new URL(request.url);
    const managerIdParam = searchParams.get('managerId');

    // Get pagination parameters
    const { page, limit, skip } = getPaginationFromSearchParams(
      searchParams,
      PAGINATION_LIMITS.MAX_STANDARD
    );

    // Determine which manager's employees to fetch
    const targetManagerId = (session.user.role === Role.ADMIN && managerIdParam)
      ? managerIdParam
      : session.user.id;

    // Get all assigned users (managers, admins, employees) - any user can be assigned as a manager
    // Previously we only allowed employees, but now any MANAGER or ADMIN can be assigned
    const whereClause = {
      managerId: targetManagerId
    };

    // Get total count
    const total = await prisma.user.count({ where: whereClause });

    const employees = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        isActive: true,
        manager: {
          select: {
            id: true,
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
      },
      skip,
      take: limit
    });

    return NextResponse.json({ 
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        department: emp.department,
        position: emp.position,
        isActive: emp.isActive,
        manager: emp.manager,
        goalsCount: emp._count.goals
      })),
      pagination: getPaginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Error fetching assigned employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned employees' },
      { status: 500 }
    );
  }
}