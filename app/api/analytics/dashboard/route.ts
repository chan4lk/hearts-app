import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole } from '@/lib/rbac';

// GET — role-scoped dashboard analytics
export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const tenantId = ctx.tenantId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Common stats
  const [totalHearts, activeGoals, totalEvents, activeCycles] = await Promise.all([
    prisma.heart.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.goal.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.event.count({ where: { tenantId, status: 'SCHEDULED', dateTime: { gte: new Date() } } }),
    prisma.reviewCycle.count({ where: { tenantId, status: 'ACTIVE' } }),
  ]);

  // Role-specific stats
  if (hasMinRole(ctx, 'ADMIN')) {
    const [totalUsers, totalGoals, completedGoals] = await Promise.all([
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.goal.count({ where: { tenantId } }),
      prisma.goal.count({ where: { tenantId, status: 'COMPLETED' } }),
    ]);

    return NextResponse.json({
      role: 'ADMIN',
      heartsThisMonth: totalHearts,
      activeGoals,
      upcomingEvents: totalEvents,
      activeCycles,
      totalUsers,
      totalGoals,
      completedGoals,
      goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    });
  }

  if (hasMinRole(ctx, 'MANAGER')) {
    const teamMembers = await prisma.user.findMany({
      where: { tenantId, managerId: ctx.userId, isActive: true },
      select: { id: true },
    });
    const teamIds = teamMembers.map(m => m.id);

    const [teamGoals, teamHearts] = await Promise.all([
      prisma.goal.count({ where: { tenantId, ownerId: { in: teamIds }, status: 'ACTIVE' } }),
      prisma.heart.count({ where: { tenantId, receiverId: { in: teamIds }, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return NextResponse.json({
      role: 'MANAGER',
      heartsThisMonth: totalHearts,
      activeGoals,
      upcomingEvents: totalEvents,
      activeCycles,
      teamSize: teamIds.length,
      teamActiveGoals: teamGoals,
      teamHeartsReceived: teamHearts,
    });
  }

  // Employee
  const [myHearts, myGoals] = await Promise.all([
    prisma.heart.count({ where: { tenantId, receiverId: ctx.userId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.goal.count({ where: { tenantId, ownerId: ctx.userId, status: 'ACTIVE' } }),
  ]);

  return NextResponse.json({
    role: 'EMPLOYEE',
    heartsThisMonth: totalHearts,
    activeGoals: myGoals,
    upcomingEvents: totalEvents,
    activeCycles,
    myHeartsReceived: myHearts,
  });
}
