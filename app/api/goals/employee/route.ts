import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: {
        employeeId: session.user.id,
      },
      include: {
        User_Goal_employeeIdToUser: true,
        ratings: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching employee goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee goals" },
      { status: 500 }
    );
  }
} 