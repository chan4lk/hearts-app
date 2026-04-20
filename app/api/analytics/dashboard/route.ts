import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';
import { hasMinRole } from '@/lib/rbac';

export async function GET() {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const tenantId = ctx.tenantId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  if (hasMinRole(ctx, 'ADMIN')) {
    const [
      totalHearts,
      activeGoals,
      totalEvents,
      activeCycles,
      totalUsers,
      totalGoals,
      completedGoals,
    ] = await Promise.all([
      prisma.heart.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.goal.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.event.count({ where: { tenantId, status: 'SCHEDULED', dateTime: { gte: now } } }),
      prisma.reviewCycle.count({ where: { tenantId, status: 'ACTIVE' } }),
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
    const teamIds = teamMembers.map((m) => m.id);

    const [totalHearts, activeGoals, totalEvents, activeCycles, teamGoals, teamHearts] = await Promise.all([
      prisma.heart.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.goal.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.event.count({ where: { tenantId, status: 'SCHEDULED', dateTime: { gte: now } } }),
      prisma.reviewCycle.count({ where: { tenantId, status: 'ACTIVE' } }),
      teamIds.length
        ? prisma.goal.count({ where: { tenantId, ownerId: { in: teamIds }, status: 'ACTIVE' } })
        : Promise.resolve(0),
      teamIds.length
        ? prisma.heart.count({ where: { tenantId, receiverId: { in: teamIds }, createdAt: { gte: thirtyDaysAgo } } })
        : Promise.resolve(0),
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

  const [totalHearts, myGoals, totalEvents, activeCycles, myHearts] = await Promise.all([
    prisma.heart.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.goal.count({ where: { tenantId, ownerId: ctx.userId, status: 'ACTIVE' } }),
    prisma.event.count({ where: { tenantId, status: 'SCHEDULED', dateTime: { gte: now } } }),
    prisma.reviewCycle.count({ where: { tenantId, status: 'ACTIVE' } }),
    prisma.heart.count({ where: { tenantId, receiverId: ctx.userId, createdAt: { gte: thirtyDaysAgo } } }),
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
