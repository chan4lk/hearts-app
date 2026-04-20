import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { z } from 'zod';
import { notifyHeartReceived } from '@/lib/email';

// GET — Hearts feed (paginated, recent first)
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

  const hearts = await prisma.heart.findMany({
    where: { tenantId: ctx.tenantId },
    take: limit + 1, // +1 to check if more exist
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, email: true, department: true } },
      receiver: { select: { id: true, name: true, email: true, department: true } },
      valueTag: { select: { id: true, name: true } },
    },
  });

  const hasMore = hearts.length > limit;
  const items = hasMore ? hearts.slice(0, limit) : hearts;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor, hasMore });
}

const GiveHeartSchema = z.object({
  receiverId: z.string().min(1),
  valueTagId: z.string().min(1),
  message: z.string().max(500).optional(),
});

// POST — Give a Heart
export async function POST(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const parsed = GiveHeartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { receiverId, valueTagId, message } = parsed.data;

  // Can't give a heart to yourself
  if (receiverId === ctx.userId) {
    return NextResponse.json({ error: 'Cannot give a heart to yourself', code: 'CONFLICT' }, { status: 409 });
  }

  // Verify receiver exists and belongs to same tenant
  const receiver = await prisma.user.findFirst({
    where: { id: receiverId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!receiver) {
    return NextResponse.json({ error: 'Recipient not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Verify value tag exists and is active
  const valueTag = await prisma.companyValue.findFirst({
    where: { id: valueTagId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!valueTag) {
    return NextResponse.json({ error: 'Company value not found or inactive', code: 'NOT_FOUND' }, { status: 404 });
  }

  // Rate limiting: max 3 hearts to same person per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const heartsToSamePersonToday = await prisma.heart.count({
    where: {
      tenantId: ctx.tenantId,
      senderId: ctx.userId,
      receiverId,
      createdAt: { gte: today },
    },
  });
  if (heartsToSamePersonToday >= 3) {
    return NextResponse.json({ error: 'You can send a maximum of 3 hearts per day to the same person', code: 'CONFLICT' }, { status: 409 });
  }

  const heart = await prisma.heart.create({
    data: {
      tenantId: ctx.tenantId,
      senderId: ctx.userId,
      receiverId,
      valueTagId,
      message: message || null,
    },
    include: {
      sender: { select: { id: true, name: true, email: true, department: true } },
      receiver: { select: { id: true, name: true, email: true, department: true } },
      valueTag: { select: { id: true, name: true } },
    },
  });

  // Queue email + in-app notification
  notifyHeartReceived(ctx.tenantId, receiverId, heart.sender.name, heart.valueTag.name, message, heart.id).catch(() => {});

  return NextResponse.json(heart, { status: 201 });
}
