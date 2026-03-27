import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { z } from 'zod';

// GET — review detail with evidence (goals, hearts)
export async function GET(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const review = await prisma.review.findFirst({
    where: { id: params.reviewId, tenantId: ctx.tenantId },
    include: {
      employee: { select: { id: true, name: true, email: true, department: true } },
      manager: { select: { id: true, name: true } },
      reviewCycle: true,
    },
  });

  if (!review) return NextResponse.json({ error: 'Review not found', code: 'NOT_FOUND' }, { status: 404 });

  // Get employee's goals for this review period
  const goals = await prisma.goal.findMany({
    where: { tenantId: ctx.tenantId, ownerId: review.employeeId },
    orderBy: { updatedAt: 'desc' },
  });

  // Get hearts received during review period
  const hearts = await prisma.heart.findMany({
    where: {
      tenantId: ctx.tenantId,
      receiverId: review.employeeId,
      createdAt: { gte: review.reviewCycle.startDate, lte: review.reviewCycle.endDate },
    },
    include: {
      sender: { select: { name: true } },
      valueTag: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ ...review, evidence: { goals, hearts } });
}

const UpdateReviewSchema = z.object({
  selfComments: z.string().max(5000).optional(),
  selfRating: z.number().min(1).max(5).optional(),
  managerComments: z.string().max(5000).optional(),
  managerRating: z.number().min(1).max(5).optional(),
});

// PATCH — update review (self-review or manager review)
export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const review = await prisma.review.findFirst({
    where: { id: params.reviewId, tenantId: ctx.tenantId },
  });
  if (!review) return NextResponse.json({ error: 'Review not found', code: 'NOT_FOUND' }, { status: 404 });
  if (review.isFinalized) return NextResponse.json({ error: 'Review is finalized and cannot be edited', code: 'IMMUTABLE' }, { status: 422 });

  const body = await req.json();
  const parsed = UpdateReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 });

  const data: any = {};
  // Employee submitting self-review
  if (parsed.data.selfComments !== undefined) { data.selfComments = parsed.data.selfComments; data.selfSubmittedAt = new Date(); }
  if (parsed.data.selfRating !== undefined) data.selfRating = parsed.data.selfRating;
  // Manager submitting review
  if (parsed.data.managerComments !== undefined) { data.managerComments = parsed.data.managerComments; data.managerSubmittedAt = new Date(); }
  if (parsed.data.managerRating !== undefined) data.managerRating = parsed.data.managerRating;

  const updated = await prisma.review.update({ where: { id: params.reviewId }, data });
  return NextResponse.json(updated);
}
