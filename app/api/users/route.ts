import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { Role, User as PrismaUser } from '.prisma/client';
import bcrypt from 'bcryptjs';

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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
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
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
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
        email,
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
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 