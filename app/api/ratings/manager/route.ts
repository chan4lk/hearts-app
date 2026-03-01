import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { rateLimiters } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimiters.moderate(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers and admins can submit manager ratings
    if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { ratings } = await req.json();

    // Validate ratings
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json({ error: "Invalid ratings data" }, { status: 400 });
    }

    // Validate all ratings have justification comments
    for (const rating of ratings) {
      if (rating.score > 0 && (!rating.comments || typeof rating.comments !== 'string' || rating.comments.trim().length < 10)) {
        return NextResponse.json(
          { error: `Rating justification is required for each rating (minimum 10 characters)` },
          { status: 400 }
        );
      }
    }

    // Create ratings in a transaction using upsert (one rating per goal)
    const result = await prisma.$transaction(async (tx) => {
      // First, get the goals with employee info
      const goals = await tx.goal.findMany({
        where: {
          id: {
            in: ratings.map((r) => r.goalId),
          },
        },
        select: {
          id: true,
          employeeId: true,
          employee: {
            select: { managerId: true }
          }
        },
      });

      const upsertedRatings = await Promise.all(
        ratings.map((rating) => {
          const goal = goals.find((g) => g.id === rating.goalId);
          if (!goal) throw new Error("Goal not found");

          // Verify manager has permission (skip for admin)
          if (session.user.role === 'MANAGER' && goal.employee.managerId !== session.user.id) {
            throw new Error(`You can only rate goals of your direct reports`);
          }

          return tx.rating.upsert({
            where: { goalId: rating.goalId },
            update: {
              managerScore: rating.score,
              managerComments: rating.comments,
              managerRatedById: session.user.id,
              managerRatedAt: new Date(),
            },
            create: {
              goalId: rating.goalId,
              managerScore: rating.score,
              managerComments: rating.comments,
              managerRatedById: session.user.id,
              managerRatedAt: new Date(),
            },
          });
        })
      );

      // Create notifications for employees
      await Promise.all(
        goals.map((goal) =>
          tx.notification.create({
            data: {
              userId: goal.employeeId,
              type: NotificationType.RATING_RECEIVED,
              message: "Your manager has rated your goals",
              goalId: goal.id,
            },
          })
        )
      );

      return upsertedRatings.map(r => ({
        id: r.id,
        goalId: r.goalId,
        score: r.managerScore,
        comments: r.managerComments,
        managerRatedAt: r.managerRatedAt,
      }));
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}