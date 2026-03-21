import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, User as PrismaUser } from '.prisma/client';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/validation';
import { handleApiError } from '@/app/api/utils/error-handler';
import { logger } from '@/lib/logger';

// Define the type for user with relations
type UserWithRelations = PrismaUser & {
  manager: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  employees: {
    id: string;
    name: string;
    role: Role;
  }[];
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use session role directly (already verified by NextAuth) — eliminates extra query
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 500, // Safety limit to prevent unbounded memory usage
      include: {
        manager: {
          select: { id: true, name: true, email: true, role: true }
        },
        employees: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform the data to match our frontend types
    const transformedUsers = users.map((user: UserWithRelations) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      manager: user.manager,
      managedUsers: user.employees,
      department: user.department,
      position: user.position
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check for existing user with case-insensitive email lookup
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim(), // Keep original casing
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
} 