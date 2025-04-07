import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
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
        goals: {
          where: {
            status: 'APPROVED',
          },
          select: {
            id: true,
            title: true,
            description: true,
            selfRating: true,
            managerRating: true,
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