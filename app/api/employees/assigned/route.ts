import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch employees assigned to the current manager
    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
        role: 'EMPLOYEE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching assigned employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned employees' },
      { status: 500 }
    );
  }
}