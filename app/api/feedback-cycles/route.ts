import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all feedback cycles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only admins and managers can view feedback cycles
    if (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const cycles = await prisma.feedbackCycle.findMany({
      where: {
        isActive: true
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competencies: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        _count: {
          select: {
            feedbacks: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ cycles });
  } catch (error) {
    console.error('Error fetching feedback cycles:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch feedback cycles',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new feedback cycle
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only admins can create feedback cycles
    if (session.user.role !== Role.ADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, startDate, endDate, competencyIds } = body;

    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cycle = await prisma.feedbackCycle.create({
      data: {
        name,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: session.user.id,
        competencies: {
          connect: competencyIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        competencies: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error('Error creating feedback cycle:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create feedback cycle',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 