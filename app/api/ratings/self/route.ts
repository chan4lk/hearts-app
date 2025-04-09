import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

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

    // Process each rating
    const results = await Promise.all(
      ratings.map(async (rating) => {
        const { goalId, score, comments } = rating;

        // Get the goal to check if it exists and get the manager ID
        const goal = await prisma.goal.findUnique({
          where: { id: goalId },
          select: { managerId: true }
        });

        if (!goal) {
          throw new Error(`Goal ${goalId} not found`);
        }

        // Find existing rating
        const existingRating = await prisma.rating.findFirst({
          where: {
            goalId,
            selfRatedById: session.user.id,
          },
        });

        // Create or update the rating
        const updatedRating = existingRating 
          ? await prisma.rating.update({
              where: { id: existingRating.id },
              data: {
                score,
                comments,
              },
            })
          : await prisma.rating.create({
              data: {
                goalId,
                selfRatedById: session.user.id,
                score,
                comments,
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

        return updatedRating;
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error submitting self-ratings:", error);
    return NextResponse.json(
      { error: "Failed to submit self-ratings" },
      { status: 500 }
    );
  }
} 