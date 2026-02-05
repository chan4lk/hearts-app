import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'SCHEDULED';
    const eventType = searchParams.get('eventType');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: { in: status.split(',') },
    };
    if (eventType) where.eventType = eventType;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Fetch events with pagination
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          participations: {
            where: { userId: session.user.id },
            select: { id: true, participationStatus: true },
          },
          _count: {
            select: { participations: true },
          },
        },
        orderBy: { startDate: 'asc' },
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events: events.map((event: any) => ({
        ...event,
        participantCount: event._count.participations,
        userParticipation: event.participations[0] || null,
      })),
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
