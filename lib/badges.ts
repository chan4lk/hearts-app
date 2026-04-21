/**
 * Achievement badges — static catalog + incremental awarding.
 *
 * Call `checkAndAwardBadges(userId, tenantId, trigger)` after an action
 * that might unlock a badge (goal complete, heart given/received, etc.).
 * Only the criteria relevant to the trigger are re-evaluated for
 * efficiency, and existing badges are short-circuited.
 *
 * Adding a new badge:
 *   1. Add a value to the BadgeKind enum in schema.prisma
 *   2. Run the migration
 *   3. Add an entry to BADGE_CATALOG below with icon + threshold
 *   4. Add the detection rule inside the matching trigger branch of
 *      checkAndAwardBadges()
 */
import { BadgeKind } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

export type BadgeTrigger =
  | 'GOAL_COMPLETED'
  | 'HEART_RECEIVED'
  | 'HEART_GIVEN'
  | 'GOAL_ASSIGNED';

export interface BadgeDef {
  kind: BadgeKind;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  // Lucide icon name (drawn client-side)
  icon: string;
  // CSS variable name for color (without "rgb(var(" wrapper)
  color: string;
  // Short formula for the progress bar — "current/target"
  target: number;
  category: 'goals' | 'recognition' | 'leadership';
}

export const BADGE_CATALOG: Record<BadgeKind, BadgeDef> = {
  FIRST_GOAL_DONE: {
    kind: 'FIRST_GOAL_DONE',
    title: 'First Step',
    description: 'Completed your first goal',
    tier: 'bronze',
    icon: 'Flag',
    color: '--color-goal-completed',
    target: 1,
    category: 'goals',
  },
  FIVE_GOALS_DONE: {
    kind: 'FIVE_GOALS_DONE',
    title: 'Finisher',
    description: 'Completed 5 goals',
    tier: 'silver',
    icon: 'CheckCircle2',
    color: '--color-accent',
    target: 5,
    category: 'goals',
  },
  TWENTY_FIVE_GOALS_DONE: {
    kind: 'TWENTY_FIVE_GOALS_DONE',
    title: 'Achiever',
    description: 'Completed 25 goals',
    tier: 'gold',
    icon: 'Trophy',
    color: '--color-warning',
    target: 25,
    category: 'goals',
  },
  HUNDRED_GOALS_DONE: {
    kind: 'HUNDRED_GOALS_DONE',
    title: 'Legend',
    description: 'Completed 100 goals',
    tier: 'platinum',
    icon: 'Crown',
    color: '--color-cat-kpi',
    target: 100,
    category: 'goals',
  },
  ON_TIME_STREAK_10: {
    kind: 'ON_TIME_STREAK_10',
    title: 'On the Clock',
    description: 'Completed 10 goals on or before the deadline',
    tier: 'gold',
    icon: 'Clock',
    color: '--color-goal-active',
    target: 10,
    category: 'goals',
  },
  FIRST_HEART: {
    kind: 'FIRST_HEART',
    title: 'Appreciated',
    description: 'Received your first Heart',
    tier: 'bronze',
    icon: 'Heart',
    color: '--color-heart',
    target: 1,
    category: 'recognition',
  },
  TEN_HEARTS: {
    kind: 'TEN_HEARTS',
    title: 'Team Favorite',
    description: 'Received 10 Hearts',
    tier: 'silver',
    icon: 'Heart',
    color: '--color-heart',
    target: 10,
    category: 'recognition',
  },
  FIFTY_HEARTS: {
    kind: 'FIFTY_HEARTS',
    title: 'Beloved',
    description: 'Received 50 Hearts',
    tier: 'gold',
    icon: 'Heart',
    color: '--color-heart',
    target: 50,
    category: 'recognition',
  },
  HUNDRED_HEARTS: {
    kind: 'HUNDRED_HEARTS',
    title: 'Hearts Legend',
    description: 'Received 100 Hearts',
    tier: 'platinum',
    icon: 'Heart',
    color: '--color-heart',
    target: 100,
    category: 'recognition',
  },
  VALUE_CHAMPION: {
    kind: 'VALUE_CHAMPION',
    title: 'Value Champion',
    description: 'Received 5 Hearts for the same company value',
    tier: 'gold',
    icon: 'Award',
    color: '--color-warning',
    target: 5,
    category: 'recognition',
  },
  KIND_SOUL_50: {
    kind: 'KIND_SOUL_50',
    title: 'Kind Soul',
    description: 'Gave 50 Hearts to teammates',
    tier: 'gold',
    icon: 'Sparkles',
    color: '--color-heart',
    target: 50,
    category: 'recognition',
  },
  CATEGORY_EXPLORER_5: {
    kind: 'CATEGORY_EXPLORER_5',
    title: 'Explorer',
    description: 'Completed goals across 5 different categories',
    tier: 'gold',
    icon: 'Compass',
    color: '--color-accent',
    target: 5,
    category: 'goals',
  },
  MENTOR_3: {
    kind: 'MENTOR_3',
    title: 'Mentor',
    description: 'Assigned goals to 3 different people',
    tier: 'silver',
    icon: 'Users',
    color: '--color-info',
    target: 3,
    category: 'leadership',
  },
};

export const BADGE_LIST: BadgeDef[] = Object.values(BADGE_CATALOG);

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
