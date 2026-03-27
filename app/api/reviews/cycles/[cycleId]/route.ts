import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantContext } from '@/lib/tenantScope';

// GET — cycle detail with reviews list
export async function GET(req: NextRequest, { params }: { params: { cycleId: string } }) {
  const ctx = await getTenantContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });

  const cycle = await prisma.reviewCycle.findFirst({
    where: { id: params.cycleId, tenantId: ctx.tenantId },
    include: {
      reviews: {
        include: {
          employee: { select: { id: true, name: true, department: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { employee: { name: 'asc' } },
      },
    },
  });

  if (!cycle) return NextResponse.json({ error: 'Cycle not found', code: 'NOT_FOUND' }, { status: 404 });

  const stats = {
    total: cycle.reviews.length,
    selfCompleted: cycle.reviews.filter(r => r.selfSubmittedAt).length,
    managerCompleted: cycle.reviews.filter(r => r.managerSubmittedAt).length,
    finalized: cycle.reviews.filter(r => r.isFinalized).length,
  };

  return NextResponse.json({ ...cycle, stats });
}
