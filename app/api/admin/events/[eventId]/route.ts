import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participations: {
          include: {
            user: { select: { id: true, name: true, email: true, department: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      categoryLabel,
      location,
      startDate,
      endDate,
      capacity,
      registrationDeadline,
      status,
    } = body;

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        title: title || event.title,
        description: description || event.description,
        eventType: eventType || event.eventType,
        categoryLabel: eventType === 'OTHER' ? categoryLabel : (eventType ? null : event.categoryLabel),
        location: location ?? event.location,
        startDate: startDate ? new Date(startDate) : event.startDate,
        endDate: endDate ? new Date(endDate) : event.endDate,
        capacity: capacity !== undefined ? (capacity ? parseInt(capacity) : null) : event.capacity,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : event.registrationDeadline,
        status: status || event.status,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        participations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    logger.log(`Event updated: ${params.eventId} by ${session.user.name}`);

    return NextResponse.json(updatedEvent);
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.event.delete({
      where: { id: params.eventId },
    });

    logger.log(`Event deleted: ${params.eventId} by ${session.user.name}`);

    return NextResponse.json({ success: true });
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
