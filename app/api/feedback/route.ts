import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        OR: [
          { fromId: session.user.id },
          { toId: session.user.id },
        ],
      },
      include: {
        givenBy: {
          select: {
            name: true,
          },
        },
        receivedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, receiverId, goalId } = await request.json();

    if (!content || !receiverId || !goalId) {
      return NextResponse.json(
        { error: 'Content, recipient, and goal are required' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        content,
        fromId: session.user.id,
        toId: receiverId,
        status: 'ACTIVE',
      },
      include: {
        givenBy: {
          select: {
            name: true,
          },
        },
        receivedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 