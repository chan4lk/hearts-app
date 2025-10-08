import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
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

    // Determine which manager's employees to fetch
    const targetManagerId = (session.user.role === Role.ADMIN && managerIdParam)
      ? managerIdParam
      : session.user.id;

    console.log('Fetching employees for manager:', targetManagerId);

    // For admin, get all assigned users (managers, admins, employees)
    // For manager, get only assigned employees
    const whereClause = session.user.role === Role.ADMIN
      ? {
          managerId: targetManagerId
        }
      : {
          managerId: targetManagerId,
          role: Role.EMPLOYEE
        };

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
      }
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
      }))
    });
  } catch (error) {
    console.error('Error fetching assigned employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned employees' },
      { status: 500 }
    );
  }
}