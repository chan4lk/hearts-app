import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all competencies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const competencies = await prisma.competency.findMany({
      where: {
        isActive: true
      },
      include: {
        levels: {
          orderBy: {
            level: 'asc'
          }
        },
        _count: {
          select: {
            assessments: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({ competencies });
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch competencies',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new competency
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only admins can create competencies
    if (session.user.role !== Role.ADMIN) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, weight, levels } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const competency = await prisma.competency.create({
      data: {
        name,
        description,
        category,
        weight: weight || 1.0,
        levels: {
          create: levels || []
        }
      },
      include: {
        levels: {
          orderBy: {
            level: 'asc'
          }
        }
      }
    });

    return NextResponse.json({ competency });
  } catch (error) {
    console.error('Error creating competency:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create competency',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 