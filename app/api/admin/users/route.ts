import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, Prisma, PrismaClient } from '.prisma/client';

interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role: Role;
  managerId?: string;
  isActive?: boolean;
}

interface UpdateUserBody extends Omit<CreateUserBody, 'password'> {
  id: string;
  password?: string;
}

// Helper function to check if a role is managerial
function isManagerialRole(role: Role): boolean {
  return role === Role.MANAGER || role === Role.ADMIN;
}

// Helper function to check if a manager can manage a given role
function canManage(managerRole: Role, userRole: Role): boolean {
  if (userRole === Role.ADMIN) {
    return managerRole === Role.ADMIN; // Only ADMIN can manage ADMIN
  }
  if (userRole === Role.MANAGER) {
    return managerRole === Role.ADMIN || managerRole === Role.MANAGER; // ADMIN or MANAGER can manage MANAGER
  }
  if (userRole === Role.EMPLOYEE) {
    return managerRole === Role.ADMIN || managerRole === Role.MANAGER; // ADMIN or MANAGER can manage EMPLOYEE
  }
  return false;
}

// GET all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
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
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, managerId, isActive } = body as CreateUserBody;

    // Validate role is a valid Role enum value
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if manager exists if managerId is provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          role: true
        }
      });
      
      if (!manager) {
        return NextResponse.json(
          { error: 'Selected manager does not exist' },
          { status: 400 }
        );
      }

      if (!canManage(manager.role, role)) {
        return NextResponse.json(
          { error: `A user with role ${role} can only be managed by: ${role === Role.ADMIN ? 'ADMIN' : 'ADMIN or MANAGER'}` },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        managerId,
        isActive: isActive ?? true,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Update failed: Unauthorized user', session?.user);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received update request with body:', body);
    
    const { id, name, email, password, role, managerId, isActive } = body as UpdateUserBody;

    // Validate role is a valid Role enum value
    if (!Object.values(Role).includes(role)) {
      console.log('Update failed: Invalid role', role);
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    if (!id || !name || !email || !role) {
      console.log('Update failed: Missing required fields', { id, name, email, role });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if manager exists if managerId is provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          role: true
        }
      });
      
      if (!manager) {
        console.log('Update failed: Manager not found', managerId);
        return NextResponse.json(
          { error: 'Selected manager does not exist' },
          { status: 400 }
        );
      }

      if (!canManage(manager.role, role)) {
        console.log('Update failed: Manager role mismatch', { userRole: role, managerRole: manager.role });
        return NextResponse.json(
          { error: `A user with role ${role} can only be managed by: ${role === Role.ADMIN ? 'ADMIN' : 'ADMIN or MANAGER'}` },
          { status: 400 }
        );
      }
    }

    // Prevent circular manager relationships
    if (managerId === id) {
      return NextResponse.json(
        { error: 'User cannot be their own manager' },
        { status: 400 }
      );
    }

    // Check for circular manager relationships
    if (managerId) {
      const potentialManager = await prisma.user.findUnique({
        where: { id: managerId },
        include: {
          manager: true
        }
      });

      // Check if the user being updated is in the manager chain of the potential manager
      let currentManager = potentialManager?.manager;
      while (currentManager) {
        if (currentManager.id === id) {
          return NextResponse.json(
            { error: 'Circular manager relationship detected' },
            { status: 400 }
          );
        }
        currentManager = await prisma.user.findUnique({
          where: { id: currentManager.id },
          include: {
            manager: true
          }
        }).then((user: { manager: any } | null) => user?.manager || null);
      }
    }

    const updateData: any = {
      name,
      email,
      role,
      isActive,
    };

    // Only include managerId in updateData if it's explicitly provided or needs to be nulled
    if (managerId !== undefined) {
      updateData.managerId = managerId || null;
    }

    console.log('Attempting to update user with data:', updateData);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log('Successfully updated user:', user);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', {
      error,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    try {
      // Delete related records first
      await prisma.$transaction(async (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => {
        // First, delete all ratings associated with the user
        await tx.rating.deleteMany({
          where: {
            OR: [
              { selfRatedById: id },
              { managerRatedById: id }
            ]
          }
        });

        // Delete user's notifications
        await tx.notification.deleteMany({
          where: { userId: id }
        });

        // Delete user's 360 feedback (both given and received)
        await tx.feedback360.deleteMany({
          where: {
            OR: [
              { reviewerId: id },
              { employeeId: id }
            ]
          }
        });

        // Now we can safely delete goals
        await tx.goal.deleteMany({
          where: {
            OR: [
              { employeeId: id },
              { managerId: id },
              { createdById: id },
              { updatedById: id },
              { deletedById: id }
            ]
          }
        });

        // Update employees' managerId to null if this user was their manager
        await tx.user.updateMany({
          where: { managerId: id },
          data: { managerId: null }
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id }
        });
      });

      return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (txError: any) {
      console.error('Transaction error:', {
        error: txError,
        code: txError.code,
        message: txError.message,
        meta: txError.meta
      });
      throw txError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('Error deleting user:', {
      error,
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    return NextResponse.json(
      { error: `Failed to delete user: ${error.message}` },
      { status: 500 }
    );
  }
} 