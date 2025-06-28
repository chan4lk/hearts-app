import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For admin, get all employees
    // For manager, get only assigned employees
    const whereClause = session.user.role === Role.MANAGER
      ? {
          managerId: session.user.id,
          role: Role.EMPLOYEE
        }
      : {
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
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ 
      employees: employees.map(emp => ({
        ...emp,
        manager: session.user.role === Role.MANAGER ? undefined : emp.manager
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