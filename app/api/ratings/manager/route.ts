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

    const { ratings } = await req.json();

    // Validate ratings
    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json({ error: "Invalid ratings data" }, { status: 400 });
    }

    // Create ratings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // First, get the employee IDs for each goal
      const goals = await tx.goal.findMany({
        where: {
          id: {
            in: ratings.map((r) => r.goalId),
          },
        },
        select: {
          id: true,
          employeeId: true,
        },
      });

      const createdRatings = await Promise.all(
        ratings.map((rating) => {
          const goal = goals.find((g) => g.id === rating.goalId);
          if (!goal) throw new Error("Goal not found");

          return tx.rating.create({
            data: {
              goalId: rating.goalId,
              selfRatedById: goal.employeeId,
              managerRatedById: session.user.id,
              score: rating.score,
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
            },
          })
        )
      );

      return createdRatings;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error submitting manager ratings:", error);
    return NextResponse.json(
      { error: "Failed to submit manager ratings" },
      { status: 500 }
    );
  }
} 