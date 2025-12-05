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
// Allow any MANAGER or ADMIN to manage any user (including other managers/admins)
// Only restriction is that employees cannot be managers (filtered in frontend)
function canManage(managerRole: Role, userRole: Role): boolean {
  // Only MANAGER or ADMIN can be assigned as managers (employees are filtered out in frontend)
  if (managerRole !== Role.MANAGER && managerRole !== Role.ADMIN) {
    return false;
  }
  // Any MANAGER or ADMIN can manage any user role (ADMIN, MANAGER, or EMPLOYEE)
  return true;
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

      // Only MANAGER or ADMIN can be assigned as managers
      if (!canManage(manager.role, role)) {
        return NextResponse.json(
          { error: 'Only users with MANAGER or ADMIN role can be assigned as managers' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim(), // Keep original casing
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

    // Check if email is being changed to one that already exists (case-insensitive)
    const existingUserWithEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.trim(),
          mode: 'insensitive',
        },
        NOT: {
          id: id, // Exclude the current user
        },
      },
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: 'Another user with this email already exists' },
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

      // Only MANAGER or ADMIN can be assigned as managers
      if (!canManage(manager.role, role)) {
        console.log('Update failed: Manager role mismatch', { userRole: role, managerRole: manager.role });
        return NextResponse.json(
          { error: 'Only users with MANAGER or ADMIN role can be assigned as managers' },
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

    // Check for circular manager relationships (only prevent chains, not immediate bidirectional assignments)
    if (managerId) {
      const potentialManager = await prisma.user.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          managerId: true
        }
      });

      // Only check for circular chains if the potential manager already has a manager
      // Allow immediate bidirectional assignments (A manages B, B manages A)
      if (potentialManager?.managerId && potentialManager.managerId !== id) {
        // Check if the user being updated is in the manager chain of the potential manager
        // This prevents chains like A -> B -> C -> A
        const visitedIds = new Set<string>();
        visitedIds.add(managerId);
        
        let currentManagerId: string | null = potentialManager.managerId;
        let chainLength = 0;
        const maxChainLength = 50; // Safety limit to prevent infinite loops
        
        while (currentManagerId && chainLength < maxChainLength) {
          if (currentManagerId === id) {
            return NextResponse.json(
              { error: 'Circular manager relationship detected' },
              { status: 400 }
            );
          }
          
          if (visitedIds.has(currentManagerId)) {
            // Already visited this manager, break to prevent infinite loop
            break;
          }
          
          visitedIds.add(currentManagerId);
          
          // Get the next manager in the chain
          const nextUser: { managerId: string | null } | null = await prisma.user.findUnique({
            where: { id: currentManagerId },
            select: {
              managerId: true
            }
          });
          
          if (!nextUser || !nextUser.managerId) {
            break;
          }
          
          currentManagerId = nextUser.managerId;
          chainLength++;
        }
      }
    }

    const updateData: any = {
      name,
      email: email.trim(), // Keep original casing
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