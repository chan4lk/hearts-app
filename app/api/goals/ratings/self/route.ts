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

    // Get all ratings for goals where the user is either the employee or manager
    const ratings = await prisma.rating.findMany({
      where: {
        OR: [
          { selfRatedById: session.user.id },
          { managerRatedById: session.user.id }
        ]
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({ ratings });
  } catch (error) {
    console.error('Error fetching self ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
} 