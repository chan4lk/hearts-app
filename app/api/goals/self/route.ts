import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch goals where the user is either the employee or the manager
    const goals = await prisma.goal.findMany({
      where: {
        OR: [
          { employeeId: session.user.id },
          { managerId: session.user.id }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
} 