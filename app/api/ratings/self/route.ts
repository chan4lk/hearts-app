import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ratings } = body;

    if (!Array.isArray(ratings)) {
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

    // Process each rating using upsert (one rating per goal)
    const results = await Promise.all(
      ratings.map(async (rating) => {
        const { goalId, score, comments } = rating;

        // Get the goal to check if it exists and get the manager ID
        const goal = await prisma.goal.findUnique({
          where: { id: goalId },
          select: { managerId: true, employeeId: true }
        });

        if (!goal) {
          throw new Error(`Goal ${goalId} not found`);
        }

        // Verify the user is the employee of this goal
        if (goal.employeeId !== session.user.id) {
          throw new Error(`You can only self-rate your own goals`);
        }

        // Upsert rating - one rating per goal
        const updatedRating = await prisma.rating.upsert({
          where: { goalId },
          update: {
            selfScore: score,
            selfComments: comments,
            selfRatedById: session.user.id,
            selfRatedAt: new Date(),
          },
          create: {
            goalId,
            selfScore: score,
            selfComments: comments,
            selfRatedById: session.user.id,
            selfRatedAt: new Date(),
          },
        });

        // Create notification for manager
        if (goal.managerId) {
          await prisma.notification.create({
            data: {
              type: NotificationType.RATING_RECEIVED,
              message: `New self-rating submitted for goal`,
              userId: goal.managerId,
              goalId,
            },
          });
        }

        return {
          id: updatedRating.id,
          goalId: updatedRating.goalId,
          score: updatedRating.selfScore,
          comments: updatedRating.selfComments,
          selfRatedAt: updatedRating.selfRatedAt,
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}