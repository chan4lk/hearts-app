import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, CompetencyCategory } from '.prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch all competencies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const competencies = await prisma.competency.findMany({
      where: { isActive: true },
      include: {
        levels: {
          orderBy: { level: 'asc' }
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
      { error: 'Failed to fetch competencies' },
      { status: 500 }
    );
  }
}

// POST - Create a new competency
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create competencies
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, category, weight = 1.0, levels } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!Object.values(CompetencyCategory).includes(category)) {
      return NextResponse.json(
        { error: 'Invalid competency category' },
        { status: 400 }
      );
    }

    // Create competency with levels
    const competency = await prisma.competency.create({
      data: {
        name,
        description,
        category,
        weight,
        levels: {
          create: levels || [
            {
              level: 1,
              name: 'Beginner',
              description: 'Basic understanding and limited experience',
              examples: ['Shows basic knowledge', 'Requires guidance', 'Learning fundamentals']
            },
            {
              level: 2,
              name: 'Developing',
              description: 'Some experience and growing capability',
              examples: ['Demonstrates growing proficiency', 'Can work independently with guidance', 'Shows improvement']
            },
            {
              level: 3,
              name: 'Competent',
              description: 'Solid performance and consistent capability',
              examples: ['Consistently meets expectations', 'Works independently', 'Reliable performance']
            },
            {
              level: 4,
              name: 'Advanced',
              description: 'Strong performance and high capability',
              examples: ['Exceeds expectations', 'Can mentor others', 'Demonstrates expertise']
            },
            {
              level: 5,
              name: 'Expert',
              description: 'Exceptional performance and mastery',
              examples: ['Consistently exceeds expectations', 'Subject matter expert', 'Can lead and innovate']
            }
          ]
        }
      },
      include: {
        levels: {
          orderBy: { level: 'asc' }
        }
      }
    });

    return NextResponse.json({ competency });
  } catch (error) {
    console.error('Error creating competency:', error);
    return NextResponse.json(
      { error: 'Failed to create competency' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update competencies
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, category, weight, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Competency ID is required' },
        { status: 400 }
      );
    }

    const competency = await prisma.competency.update({
      where: { id },
      data: {
        name,
        description,
        category,
        weight,
        isActive
      },
      include: {
        levels: {
          orderBy: { level: 'asc' }
        }
      }
    });

    return NextResponse.json({ competency });
  } catch (error) {
    console.error('Error updating competency:', error);
    return NextResponse.json(
      { error: 'Failed to update competency' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete competencies
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Competency ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.competency.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting competency:', error);
    return NextResponse.json(
      { error: 'Failed to delete competency' },
      { status: 500 }
    );
  }
} 