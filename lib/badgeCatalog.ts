/**
 * Client-safe badge catalog — constants + types only, no Prisma or Node APIs.
 *
 * Import this from client components (e.g. `'use client'` pages). The
 * prisma-backed awarding logic lives in `lib/badges.ts` and must only be
 * imported from server code (API routes).
 */
import { BadgeKind } from '@prisma/client';

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
  /** Lucide icon name (drawn client-side) */
  icon: string;
  /** CSS variable name for color (without "rgb(var(" wrapper) */
  color: string;
  /** Short formula for the progress bar — "current/target" */
  target: number;
  category: 'goals' | 'recognition' | 'leadership';
}

export const BADGE_CATALOG: Record<BadgeKind, BadgeDef> = {
  // ─── Goals progression ──────────────────────────────────────────
  FIRST_GOAL_DONE: {
    kind: 'FIRST_GOAL_DONE',
    title: 'First Step',
    description: 'Completed your first goal',
    tier: 'bronze',
    icon: 'Rocket',
    color: '--color-goal-completed',
    target: 1,
    category: 'goals',
  },
  FIVE_GOALS_DONE: {
    kind: 'FIVE_GOALS_DONE',
    title: 'Finisher',
    description: 'Completed 5 goals',
    tier: 'silver',
    icon: 'Target',
    color: '--color-accent',
    target: 5,
    category: 'goals',
  },
  TWENTY_FIVE_GOALS_DONE: {
    kind: 'TWENTY_FIVE_GOALS_DONE',
    title: 'Achiever',
    description: 'Completed 25 goals',
    tier: 'gold',
    icon: 'Medal',
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
    icon: 'Zap',
    color: '--color-goal-active',
    target: 10,
    category: 'goals',
  },
  CATEGORY_EXPLORER_5: {
    kind: 'CATEGORY_EXPLORER_5',
    title: 'Explorer',
    description: 'Completed goals across 5 different categories',
    tier: 'gold',
    icon: 'Map',
    color: '--color-accent',
    target: 5,
    category: 'goals',
  },
  // ─── Recognition ───────────────────────────────────────────────
  FIRST_HEART: {
    kind: 'FIRST_HEART',
    title: 'Appreciated',
    description: 'Received your first Heart',
    tier: 'bronze',
    icon: 'ThumbsUp',
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
    icon: 'HeartHandshake',
    color: '--color-heart',
    target: 50,
    category: 'recognition',
  },
  HUNDRED_HEARTS: {
    kind: 'HUNDRED_HEARTS',
    title: 'Hearts Legend',
    description: 'Received 100 Hearts',
    tier: 'platinum',
    icon: 'Gem',
    color: '--color-heart',
    target: 100,
    category: 'recognition',
  },
  VALUE_CHAMPION: {
    kind: 'VALUE_CHAMPION',
    title: 'Value Champion',
    description: 'Received 5 Hearts for the same company value',
    tier: 'gold',
    icon: 'Shield',
    color: '--color-warning',
    target: 5,
    category: 'recognition',
  },
  KIND_SOUL_50: {
    kind: 'KIND_SOUL_50',
    title: 'Kind Soul',
    description: 'Gave 50 Hearts to teammates',
    tier: 'gold',
    icon: 'HandHeart',
    color: '--color-heart',
    target: 50,
    category: 'recognition',
  },
  // ─── Leadership ────────────────────────────────────────────────
  MENTOR_3: {
    kind: 'MENTOR_3',
    title: 'Mentor',
    description: 'Assigned goals to 3 different people',
    tier: 'silver',
    icon: 'GraduationCap',
    color: '--color-info',
    target: 3,
    category: 'leadership',
  },
};

export const BADGE_LIST: BadgeDef[] = Object.values(BADGE_CATALOG);
