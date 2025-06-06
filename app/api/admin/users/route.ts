import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
            email: true
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
    const { name, email, password, role, managerId, isActive } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Require manager for employees
    if (role === 'EMPLOYEE' && !managerId) {
      return NextResponse.json(
        { error: 'Manager is required for employees' },
        { status: 400 }
      );
    }

    // Check if manager exists if managerId is provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager || manager.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Invalid manager selected' },
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
        managerId: role === 'EMPLOYEE' ? managerId : null,
        isActive: isActive ?? true,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, role, managerId, isActive } = body;

    if (!id || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Require manager for employees
    if (role === 'EMPLOYEE' && !managerId) {
      return NextResponse.json(
        { error: 'Manager is required for employees' },
        { status: 400 }
      );
    }

    // Check if manager exists if managerId is provided
    if (managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
      });
      if (!manager || manager.role !== 'MANAGER') {
        return NextResponse.json(
          { error: 'Invalid manager selected' },
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

    const updateData: any = {
      name,
      email,
      role,
      managerId: role === 'EMPLOYEE' ? managerId : null,
      isActive,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
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
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      await prisma.$transaction(async (tx) => {
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

        // Delete user's feedback (both given and received)
        await tx.feedback.deleteMany({
          where: {
            OR: [
              { fromId: id },
              { toId: id }
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