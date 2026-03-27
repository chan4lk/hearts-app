import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { z } from 'zod';

const ParticipateSchema = z.object({
  status: z.enum(['CONFIRMED', 'DECLINED']),
});

// POST — confirm/decline event participation
export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = ParticipateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });

  const participation = await prisma.eventParticipation.upsert({
    where: { tenantId_eventId_userId: { tenantId: ctx.tenantId, eventId: params.eventId, userId: ctx.userId } },
    update: { status: parsed.data.status },
    create: { tenantId: ctx.tenantId, eventId: params.eventId, userId: ctx.userId, status: parsed.data.status },
  });

  return NextResponse.json(participation);
}
