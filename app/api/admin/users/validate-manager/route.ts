import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateManagerHierarchy } from '@/lib/securityUtils';
import { z } from 'zod';
import { rateLimiters } from '@/lib/rateLimit';

const validateManagerSchema = z.object({
  newManagerId: z.string().min(1, 'Manager ID required'),
});

/**
 * Validate that setting a new manager won't create a circular reference
 * POST /api/admin/users/[id]/validate-manager
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rateLimitResponse = await rateLimiters.standard(req);
    if (rateLimitResponse) return rateLimitResponse;

    const session = await getServerSession(authOptions);

    // Only admins can validate manager changes
    if (!session || session.user.role !== 'ADMIN') {
      return Response.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = validateManagerSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: 'Invalid input', details: result.error.issues },
        { status: 400 }
      );
    }

    const { newManagerId } = result.data;
    const userId = params.id;

    // Validate the manager hierarchy
    const validation = await validateManagerHierarchy(userId, newManagerId);

    if (!validation.isValid) {
      return Response.json(
        { 
          error: validation.reason,
          valid: false 
        },
        { status: 400 }
      );
    }

    // Success - manager can be set
    return Response.json({
      valid: true,
      message: 'Manager hierarchy is valid',
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to validate manager' },
      { status: 500 }
    );
  }
}
