import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { BADGE_CATALOG, BADGE_LIST } from '@/lib/badges';
import { BadgeKind } from '@prisma/client';

/**
 * GET /api/users/[userId]/badges
 *
 * Returns the full badge catalog annotated with:
 *   - whether the user has earned each badge + earnedAt timestamp
 *   - current progress toward unearned badges (current / target)
 *
 * Visible to the user themselves, their manager, or any admin.
 */
export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const targetUser = await prisma.user.findFirst({
    where: { id: params.userId, tenantId: ctx.tenantId },
    select: { id: true, name: true, managerId: true, department: true, position: true },
  });
  if (!targetUser) return NextResponse.json({ error: 'User not found', code: 'NOT_FOUND' }, { status: 404 });

  const isSelf = targetUser.id === ctx.userId;
  const isTheirManager = targetUser.managerId === ctx.userId;
  const isAdmin = ctx.userRole === 'ADMIN';
  if (!isSelf && !isTheirManager && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const earnedRows = await prisma.userBadge.findMany({
    where: { tenantId: ctx.tenantId, userId: params.userId },
    orderBy: { earnedAt: 'desc' },
  });
  const earnedMap = new Map(earnedRows.map((b) => [b.kind, b.earnedAt]));

  // Progress counts for unearned badges (best-effort)
  const [completedGoals, heartsReceived, heartsGiven, onTimeCompleted, categoriesDistinct, valueGroups, mentorTargets] =
    await Promise.all([
      prisma.goal.count({ where: { tenantId: ctx.tenantId, ownerId: params.userId, status: 'COMPLETED' } }),
      prisma.heart.count({ where: { tenantId: ctx.tenantId, receiverId: params.userId } }),
      prisma.heart.count({ where: { tenantId: ctx.tenantId, senderId: params.userId } }),
      prisma.goal.count({
        where: { tenantId: ctx.tenantId, ownerId: params.userId, status: 'COMPLETED', targetDate: { not: null } },
      }),
      prisma.goal.findMany({
        where: { tenantId: ctx.tenantId, ownerId: params.userId, status: 'COMPLETED', category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.heart.groupBy({
        by: ['valueTagId'],
        where: { tenantId: ctx.tenantId, receiverId: params.userId },
        _count: { _all: true },
      }),
      prisma.goal.findMany({
        where: { tenantId: ctx.tenantId, assignerId: params.userId, ownerId: { not: params.userId } },
        select: { ownerId: true },
        distinct: ['ownerId'],
      }),
    ]);

  const currentFor = (kind: BadgeKind): number => {
    switch (kind) {
      case 'FIRST_GOAL_DONE':
      case 'FIVE_GOALS_DONE':
      case 'TWENTY_FIVE_GOALS_DONE':
      case 'HUNDRED_GOALS_DONE':
        return completedGoals;
      case 'ON_TIME_STREAK_10':
        return onTimeCompleted;
      case 'FIRST_HEART':
      case 'TEN_HEARTS':
      case 'FIFTY_HEARTS':
      case 'HUNDRED_HEARTS':
        return heartsReceived;
      case 'VALUE_CHAMPION':
        return Math.max(0, ...valueGroups.map((v) => v._count._all));
      case 'KIND_SOUL_50':
        return heartsGiven;
      case 'CATEGORY_EXPLORER_5':
        return categoriesDistinct.length;
      case 'MENTOR_3':
        return mentorTargets.length;
    }
  };

  const badges = BADGE_LIST.map((def) => {
    const earnedAt = earnedMap.get(def.kind) || null;
    const current = currentFor(def.kind);
    return {
      ...def,
      earnedAt: earnedAt?.toISOString() ?? null,
      earned: !!earnedAt,
      current: Math.min(current, def.target),
      percent: Math.min(100, Math.round((current / def.target) * 100)),
    };
  });

  return NextResponse.json({
    user: targetUser,
    badges,
    earnedCount: earnedRows.length,
    totalCount: BADGE_LIST.length,
  });
}
