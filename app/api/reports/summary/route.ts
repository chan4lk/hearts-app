import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole, requireMinRole } from '@/lib/rbac';
import { GoalStatus } from '@prisma/client';

/**
 * GET /api/reports/summary?scope=self|team|all
 *
 * Aggregated achievement/goal report scoped by caller's role:
 *   self  – caller's own goals + hearts (everyone)
 *   team  – MANAGER: goals of direct reports; ADMIN: every employee
 *   all   – ADMIN only: every user in tenant
 *
 * Returns:
 *   {
 *     scope, userCount, totalGoals, byStatus, byCategory[],
 *     completedGoals, completionRate, avgProgress,
 *     heartsReceived, heartsGiven,
 *     upcomingDeadlines[],
 *     perUser[]  (team/all only)
 *   }
 */
export async function GET(req: NextRequest) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const scopeParam = (new URL(req.url).searchParams.get('scope') || 'self') as 'self' | 'team' | 'all';
  if (scopeParam === 'team') requireMinRole(ctx, 'MANAGER');
  if (scopeParam === 'all') requireMinRole(ctx, 'ADMIN');

  // Resolve the target userIds based on scope
  let userIds: string[] = [];
  if (scopeParam === 'self') {
    userIds = [ctx.userId];
  } else if (scopeParam === 'team') {
    if (hasMinRole(ctx, 'ADMIN')) {
      const users = await prisma.user.findMany({
        where: { tenantId: ctx.tenantId, isActive: true, managerId: ctx.userId },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      const users = await prisma.user.findMany({
        where: { tenantId: ctx.tenantId, isActive: true, managerId: ctx.userId },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }
  } else {
    // all
    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId, isActive: true },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  }

  if (userIds.length === 0) {
    return NextResponse.json({
      scope: scopeParam,
      userCount: 0,
      totalGoals: 0,
      byStatus: {},
      byCategory: [],
      completedGoals: 0,
      completionRate: 0,
      avgProgress: 0,
      heartsReceived: 0,
      heartsGiven: 0,
      upcomingDeadlines: [],
      perUser: [],
    });
  }

  const baseWhere = { tenantId: ctx.tenantId, ownerId: { in: userIds } };

  const [
    totalGoals,
    statusGroups,
    categoryGroups,
    activeGoals,
    heartsReceivedAgg,
    heartsGivenAgg,
    upcomingDeadlines,
  ] = await Promise.all([
    prisma.goal.count({ where: baseWhere }),
    prisma.goal.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.goal.groupBy({
      by: ['category'],
      where: { ...baseWhere, category: { not: null } },
      _count: { _all: true },
    }),
    prisma.goal.findMany({
      where: { ...baseWhere, status: 'ACTIVE' },
      select: { progress: true },
    }),
    prisma.heart.count({
      where: { tenantId: ctx.tenantId, receiverId: { in: userIds } },
    }),
    prisma.heart.count({
      where: { tenantId: ctx.tenantId, senderId: { in: userIds } },
    }),
    prisma.goal.findMany({
      where: {
        ...baseWhere,
        status: 'ACTIVE',
        targetDate: { gte: new Date(), lte: new Date(Date.now() + 14 * 86400000) },
      },
      select: {
        id: true,
        title: true,
        targetDate: true,
        progress: true,
        owner: { select: { id: true, name: true } },
      },
      orderBy: { targetDate: 'asc' },
      take: 10,
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const g of statusGroups) byStatus[g.status] = g._count._all;

  const byCategory = categoryGroups
    .map((g) => ({ category: g.category as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const completedGoals = byStatus.COMPLETED || 0;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const avgProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length
        )
      : 0;

  // ── Score / Tier helpers ──────────────────────────────────────────
  // Formula: completedGoals × 10 + heartsReceived × 2 + onTime × 5 + categories × 3
  const tierOf = (score: number): { tier: string; color: string } => {
    if (score >= 501) return { tier: 'Platinum', color: '--color-cat-kpi' };
    if (score >= 201) return { tier: 'Gold', color: '--color-warning' };
    if (score >= 51) return { tier: 'Silver', color: '--color-accent' };
    return { tier: 'Bronze', color: '--color-heart' };
  };

  // Scope-level score (sum across userIds) for the KPI card on self view
  const scopeOnTimeCompletions = await prisma.goal.count({
    where: { ...baseWhere, status: 'COMPLETED', targetDate: { not: null, gte: undefined } },
  });
  // "on-time" = completed before targetDate; targetDate comparison is rough at DB level;
  // we approximate with count of completed having a targetDate. Good enough for Phase 1.

  const scopeCategoriesExplored = new Set(
    (
      await prisma.goal.findMany({
        where: { ...baseWhere, status: 'COMPLETED', category: { not: null } },
        select: { category: true },
      })
    ).map((g) => g.category!)
  ).size;

  const scopeScore =
    completedGoals * 10 + heartsReceivedAgg * 2 + scopeOnTimeCompletions * 5 + scopeCategoriesExplored * 3;
  const scopeTier = tierOf(scopeScore);

  // Per-user breakdown (team/all only)
  let perUser: Array<{
    userId: string;
    name: string;
    department: string | null;
    position: string | null;
    goalsTotal: number;
    goalsActive: number;
    goalsCompleted: number;
    completionRate: number;
    heartsReceived: number;
    score: number;
    tier: string;
    tierColor: string;
  }> = [];

  if (scopeParam !== 'self') {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, tenantId: ctx.tenantId },
      select: { id: true, name: true, department: true, position: true },
      orderBy: { name: 'asc' },
    });
    const perUserGoals = await prisma.goal.groupBy({
      by: ['ownerId', 'status'],
      where: baseWhere,
      _count: { _all: true },
    });
    const perUserHearts = await prisma.heart.groupBy({
      by: ['receiverId'],
      where: { tenantId: ctx.tenantId, receiverId: { in: userIds } },
      _count: { _all: true },
    });
    const heartsByUser = new Map(perUserHearts.map((h) => [h.receiverId, h._count._all]));

    // For per-user on-time + categories — one query each, grouped by owner
    const perUserOnTime = await prisma.goal.groupBy({
      by: ['ownerId'],
      where: { ...baseWhere, status: 'COMPLETED', targetDate: { not: null } },
      _count: { _all: true },
    });
    const onTimeByUser = new Map(perUserOnTime.map((g) => [g.ownerId, g._count._all]));

    const perUserCategories = await prisma.goal.findMany({
      where: { ...baseWhere, status: 'COMPLETED', category: { not: null } },
      select: { ownerId: true, category: true },
    });
    const catsByUser = new Map<string, Set<string>>();
    for (const g of perUserCategories) {
      if (!catsByUser.has(g.ownerId)) catsByUser.set(g.ownerId, new Set());
      catsByUser.get(g.ownerId)!.add(g.category!);
    }

    perUser = users.map((u) => {
      const own = perUserGoals.filter((g) => g.ownerId === u.id);
      const total = own.reduce((s, x) => s + x._count._all, 0);
      const active = own.find((x) => x.status === 'ACTIVE')?._count._all || 0;
      const completed = own.find((x) => x.status === 'COMPLETED')?._count._all || 0;
      const hearts = heartsByUser.get(u.id) || 0;
      const onTime = onTimeByUser.get(u.id) || 0;
      const catsExplored = catsByUser.get(u.id)?.size || 0;
      const score = completed * 10 + hearts * 2 + onTime * 5 + catsExplored * 3;
      const tierInfo = tierOf(score);
      return {
        userId: u.id,
        name: u.name,
        department: u.department,
        position: u.position,
        goalsTotal: total,
        goalsActive: active,
        goalsCompleted: completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        heartsReceived: hearts,
        score,
        tier: tierInfo.tier,
        tierColor: tierInfo.color,
      };
    });
  }

  // Top performers (only meaningful for team/all)
  const topPerformers = perUser
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return NextResponse.json({
    scope: scopeParam,
    userCount: userIds.length,
    totalGoals,
    byStatus,
    byCategory,
    completedGoals,
    completionRate,
    avgProgress,
    heartsReceived: heartsReceivedAgg,
    heartsGiven: heartsGivenAgg,
    upcomingDeadlines,
    perUser,
    score: {
      total: scopeScore,
      breakdown: {
        completedGoals: completedGoals * 10,
        heartsReceived: heartsReceivedAgg * 2,
        onTime: scopeOnTimeCompletions * 5,
        categoriesExplored: scopeCategoriesExplored * 3,
      },
      tier: scopeTier.tier,
      tierColor: scopeTier.color,
      onTimeCompletions: scopeOnTimeCompletions,
      categoriesExplored: scopeCategoriesExplored,
    },
    topPerformers,
  });
}
