import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimiters } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimiters.standard(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const templates = await prisma.goalTemplate.findMany({
    where: { isActive: true } as any,
    orderBy: { createdAt: 'desc' },
  } as any);

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimiters.moderate(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, category, department, priority, weight } = body;

  if (!name || !description) {
    return NextResponse.json({ error: 'Name and description required' }, { status: 400 });
  }

  const template = await prisma.goalTemplate.create({
    data: {
      name,
      description,
      category: category || 'PROFESSIONAL',
      department: department || 'ENGINEERING',
      priority: priority || 'MEDIUM',
      weight: weight || 10,
      createdById: session.user.id,
    } as any,
  } as any);

  return NextResponse.json({ success: true, template }, { status: 201 });
}
