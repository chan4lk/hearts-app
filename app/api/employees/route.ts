import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // During build time, return an empty array
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      return NextResponse.json([]);
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (session.user?.role !== 'MANAGER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const employees = await prisma.user.findMany({
      where: {
        managerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        Goal_Goal_employeeIdToUser: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            title: true,
            description: true,
            ratings: {
              select: {
                score: true,
                comments: true,
                selfRatedBy: {
                  select: {
                    name: true,
                  },
                },
                managerRatedBy: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 