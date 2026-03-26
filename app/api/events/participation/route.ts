import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };
    if (status) where.participationStatus = status;

    // Fetch participations with pagination
    const [participations, total] = await Promise.all([
      prisma.eventParticipation.findMany({
        where,
        skip,
        take: limit,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              eventType: true,
              categoryLabel: true,
              location: true,
              startDate: true,
              endDate: true,
              capacity: true,
              status: true,
              createdBy: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { registeredAt: 'desc' },
      }),
      prisma.eventParticipation.count({ where }),
    ]);

    return NextResponse.json({
      participations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.moderate(request);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, participationStatus, hoursContributed, feedback, toastmasterRole, heartsTalkRole } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already registered
    const existingParticipation = await prisma.eventParticipation.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.user.id,
        },
      },
    });

    if (existingParticipation && participationStatus === 'REGISTERED') {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 409 }
      );
    }

    // Create or update participation
    const participation = existingParticipation
      ? await prisma.eventParticipation.update({
          where: {
            eventId_userId: {
              eventId,
              userId: session.user.id,
            },
          },
          data: {
            participationStatus: participationStatus ?? existingParticipation.participationStatus,
            hoursContributed: hoursContributed ?? existingParticipation.hoursContributed,
            feedback: feedback ?? existingParticipation.feedback,
            toastmasterRole: toastmasterRole !== undefined ? (toastmasterRole || null) : existingParticipation.toastmasterRole,
            heartsTalkRole: heartsTalkRole !== undefined ? (heartsTalkRole || null) : existingParticipation.heartsTalkRole,
          },
          include: { event: true, user: { select: { name: true, email: true } } },
        })
      : await prisma.eventParticipation.create({
          data: {
            eventId,
            userId: session.user.id,
            participationStatus: participationStatus || 'REGISTERED',
            toastmasterRole: toastmasterRole || null,
            heartsTalkRole: heartsTalkRole || null,
            hoursContributed,
            feedback,
          },
          include: { event: true, user: { select: { name: true, email: true } } },
        });

    logger.log(`Event participation updated for ${session.user.name} in event ${eventId}`);

    return NextResponse.json(participation, { status: 201 });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to update participation' },
      { status: 500 }
    );
  }
}
