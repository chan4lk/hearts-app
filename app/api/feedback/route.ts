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
          { givenById: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        givenBy: {
          select: {
            name: true,
          },
        },
        User_Feedback_receiverIdToUser: {
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
        givenById: session.user.id,
        receiverId,
        goalId,
      },
      include: {
        givenBy: {
          select: {
            name: true,
          },
        },
        User_Feedback_receiverIdToUser: {
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