/**
 * Server-side badge awarding — uses Prisma and is NOT safe to import from
 * client components. For client-safe constants/types see `lib/badgeCatalog.ts`.
 *
 * Call `checkAndAwardBadges(userId, tenantId, trigger)` after an action that
 * might unlock a badge (goal complete, heart given/received, etc.). Only the
 * criteria relevant to the trigger are re-evaluated, and existing badges are
 * short-circuited.
 *
 * Adding a new badge:
 *   1. Add a value to the BadgeKind enum in schema.prisma
 *   2. Run the migration
 *   3. Add an entry to BADGE_CATALOG in lib/badgeCatalog.ts
 *   4. Add the detection rule in the matching trigger branch below
 */
import { BadgeKind } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';
import { BADGE_CATALOG, type BadgeTrigger } from './badgeCatalog';

// Re-export the client-safe catalog for backwards compatibility with server
// code that used to import everything from this file. New client code should
// import from `@/lib/badgeCatalog` directly.
export { BADGE_CATALOG, BADGE_LIST, type BadgeDef, type BadgeTrigger } from './badgeCatalog';

/** Idempotently check the user's progress and persist any newly-earned badges. */
export async function checkAndAwardBadges(
  userId: string,
  tenantId: string,
  trigger: BadgeTrigger
): Promise<BadgeKind[]> {
  try {
    const already = await prisma.userBadge.findMany({
      where: { tenantId, userId },
      select: { kind: true },
    });
    const earned = new Set(already.map((b) => b.kind));

    const toAward: BadgeKind[] = [];

    if (trigger === 'GOAL_COMPLETED') {
      const completed = await prisma.goal.count({
        where: { tenantId, ownerId: userId, status: 'COMPLETED' },
      });
      if (completed >= 1 && !earned.has('FIRST_GOAL_DONE')) toAward.push('FIRST_GOAL_DONE');
      if (completed >= 5 && !earned.has('FIVE_GOALS_DONE')) toAward.push('FIVE_GOALS_DONE');
      if (completed >= 25 && !earned.has('TWENTY_FIVE_GOALS_DONE')) toAward.push('TWENTY_FIVE_GOALS_DONE');
      if (completed >= 100 && !earned.has('HUNDRED_GOALS_DONE')) toAward.push('HUNDRED_GOALS_DONE');

      if (!earned.has('ON_TIME_STREAK_10')) {
        const onTime = await prisma.goal.count({
          where: { tenantId, ownerId: userId, status: 'COMPLETED', targetDate: { not: null } },
        });
        if (onTime >= 10) toAward.push('ON_TIME_STREAK_10');
      }

      if (!earned.has('CATEGORY_EXPLORER_5')) {
        const categoriesRows = await prisma.goal.findMany({
          where: { tenantId, ownerId: userId, status: 'COMPLETED', category: { not: null } },
          select: { category: true },
          distinct: ['category'],
        });
        if (categoriesRows.length >= 5) toAward.push('CATEGORY_EXPLORER_5');
      }
    }

    if (trigger === 'HEART_RECEIVED') {
      const received = await prisma.heart.count({
        where: { tenantId, receiverId: userId },
      });
      if (received >= 1 && !earned.has('FIRST_HEART')) toAward.push('FIRST_HEART');
      if (received >= 10 && !earned.has('TEN_HEARTS')) toAward.push('TEN_HEARTS');
      if (received >= 50 && !earned.has('FIFTY_HEARTS')) toAward.push('FIFTY_HEARTS');
      if (received >= 100 && !earned.has('HUNDRED_HEARTS')) toAward.push('HUNDRED_HEARTS');

      if (!earned.has('VALUE_CHAMPION')) {
        const perValue = await prisma.heart.groupBy({
          by: ['valueTagId'],
          where: { tenantId, receiverId: userId },
          _count: { _all: true },
        });
        if (perValue.some((g) => g._count._all >= 5)) toAward.push('VALUE_CHAMPION');
      }
    }

    if (trigger === 'HEART_GIVEN') {
      if (!earned.has('KIND_SOUL_50')) {
        const given = await prisma.heart.count({
          where: { tenantId, senderId: userId },
        });
        if (given >= 50) toAward.push('KIND_SOUL_50');
      }
    }

    if (trigger === 'GOAL_ASSIGNED') {
      if (!earned.has('MENTOR_3')) {
        const assignedTargets = await prisma.goal.findMany({
          where: { tenantId, assignerId: userId, ownerId: { not: userId } },
          select: { ownerId: true },
          distinct: ['ownerId'],
        });
        if (assignedTargets.length >= 3) toAward.push('MENTOR_3');
      }
    }

    if (toAward.length > 0) {
      await prisma.userBadge.createMany({
        data: toAward.map((kind) => ({ tenantId, userId, kind })),
        skipDuplicates: true,
      });
      // Fire in-app notifications (one per badge)
      await prisma.notification.createMany({
        data: toAward.map((kind) => ({
          tenantId,
          userId,
          type: 'BADGE_EARNED',
          title: `🏆 You earned the ${BADGE_CATALOG[kind].title} badge!`,
          message: BADGE_CATALOG[kind].description,
          entityType: 'UserBadge',
          entityId: kind,
        })),
      });
    }

    return toAward;
  } catch (err) {
    // Never let badge checks break the main action path.
    logger.warn('badges.check_failed', {
      userId,
      tenantId,
      trigger,
      error: err instanceof Error ? err : new Error(String(err)),
    });
    return [];
  }
}
