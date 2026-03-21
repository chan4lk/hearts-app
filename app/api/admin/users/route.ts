import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, Prisma, PrismaClient } from '.prisma/client';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';
import { getPaginationFromSearchParams, getPaginationMeta, PAGINATION_LIMITS } from '@/lib/pagination';
import { validatePassword } from '@/lib/validation';
import { handleApiError } from '@/app/api/utils/error-handler';

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

// GET all users with pagination and filtering
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Check if minimal mode is requested (for dropdowns - faster loading)
    const minimal = searchParams.get('minimal') === 'true';
    
    // Pagination parameters with limits
    const maxLimit = minimal ? PAGINATION_LIMITS.USERS_MINIMAL : PAGINATION_LIMITS.USERS;
    const { page, limit, skip } = getPaginationFromSearchParams(
      searchParams,
      maxLimit
    );
    
    // Filter parameters
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search'); // Search in name/email
    const department = searchParams.get('department');
    const managerId = searchParams.get('managerId');
    
    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const whereClause: any = {};
    
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      whereClause.isActive = isActive === 'true';
    }
    
    if (department && department !== 'all') {
      whereClause.department = department;
    }
    
    if (managerId && managerId !== 'all') {
      if (managerId === 'none') {
        whereClause.managerId = null;
      } else {
        whereClause.managerId = managerId;
      }
    }
    
    if (search && search.trim()) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { email: { contains: search.trim(), mode: 'insensitive' as const } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'role') {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Get total count (skip for minimal mode to improve performance)
    const total = minimal ? 0 : await prisma.user.count({ where: whereClause });

    // Fetch users with pagination
    // Use minimal select for faster loading when minimal=true
    const selectFields = minimal ? {
      id: true,
      name: true,
      email: true,
      role: true
    } : {
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
    };
    
    const users = await prisma.user.findMany({
      where: whereClause,
      select: selectFields,
      orderBy,
      skip,
      take: limit
    });

    return NextResponse.json({
      users,
      ...(minimal ? {} : {
        pagination: getPaginationMeta(page, limit, total)
      })
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}

// Create new user
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

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
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const { id, name, email, password, role, managerId, isActive } = body as UpdateUserBody;

    // Validate role is a valid Role enum value
    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    if (!id || !name || !email || !role) {
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

    // Prevent circular manager relationships
    if (managerId === id) {
      return NextResponse.json(
        { error: 'User cannot be their own manager' },
        { status: 400 }
      );
    }

    // Check for circular manager relationships (only prevent chains, not immediate bidirectional assignments)
    if (managerId) {
      // Batch-load the manager chain in a single query instead of 50 sequential queries.
      // Fetch all users' managerId in the potential chain at once, then walk the chain in memory.
      const allManagerLinks = await prisma.user.findMany({
        where: { managerId: { not: null } },
        select: { id: true, managerId: true }
      });

      // Build an in-memory lookup: userId -> managerId
      const managerMap = new Map<string, string>();
      for (const u of allManagerLinks) {
        if (u.managerId) managerMap.set(u.id, u.managerId);
      }

      // Walk the chain in memory (O(n) with no DB queries)
      const startManagerId = managerMap.get(managerId);
      if (startManagerId && startManagerId !== id) {
        const visitedIds = new Set<string>([managerId]);
        let currentId: string | undefined = startManagerId;
        let depth = 0;
        const maxDepth = 50;

        while (currentId && depth < maxDepth) {
          if (currentId === id) {
            return NextResponse.json(
              { error: 'Circular manager relationship detected' },
              { status: 400 }
            );
          }
          if (visitedIds.has(currentId)) break;
          visitedIds.add(currentId);
          currentId = managerMap.get(currentId);
          depth++;
        }
      }
    }

    const updateData: any = {
      name,
      email: email.trim(), // Keep original casing
      role,
      isActive,
    };

    // Validate and update password if provided
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.error },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 12); // Use 12 rounds for consistency
    }

    // Only include managerId in updateData if it's explicitly provided or needs to be nulled
    if (managerId !== undefined) {
      updateData.managerId = managerId || null;
    }

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

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
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
      logger.error(txError instanceof Error ? txError : new Error(String(txError)));
      throw txError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: `Failed to delete user: ${error.message}` },
      { status: 500 }
    );
  }
} 