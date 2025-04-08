import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        status: 'APPROVED',
        employeeId: session.user.id,
      },
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching approved goals:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 