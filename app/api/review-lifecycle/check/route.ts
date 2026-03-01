export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/app/api/utils/error-handler';

// GET - Idempotent lifecycle check
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all review cycles with dateOfAppointment set
    const reviewCycles = await prisma.reviewCycle.findMany({
      where: {
        dateOfAppointment: { not: null },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        reportingPerson: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    let remindersCreated = 0;
    let completionsCreated = 0;

    for (const cycle of reviewCycles) {
      if (!cycle.dateOfAppointment) continue;

      const employeeId = cycle.userId;
      const reportingPersonId = cycle.reportingPersonId;

      // Calculate months since date of appointment
      const appointmentDate = new Date(cycle.dateOfAppointment);
      const diffMs = now.getTime() - appointmentDate.getTime();
      const monthsSinceAppointment = diffMs / (1000 * 60 * 60 * 24 * 30.44); // average days per month

      // Check if 2 weeks before 6-month mark (5.5 months)
      if (monthsSinceAppointment >= 5.5 && monthsSinceAppointment < 6) {
        // Check if RATING_CYCLE_REMINDER notification already exists for this user in last 30 days
        const existingReminder = await prisma.notification.findFirst({
          where: {
            type: NotificationType.RATING_CYCLE_REMINDER,
            userId: employeeId,
            createdAt: { gte: thirtyDaysAgo },
          },
        });

        if (!existingReminder) {
          // Create reminder for employee
          await prisma.notification.create({
            data: {
              type: NotificationType.RATING_CYCLE_REMINDER,
              message: `Your 6-month rating cycle is approaching. Please ensure your goals and self-ratings are up to date.`,
              userId: employeeId,
            },
          });
          remindersCreated++;

          // Create reminder for reporting person if exists
          if (reportingPersonId) {
            await prisma.notification.create({
              data: {
                type: NotificationType.RATING_CYCLE_REMINDER,
                message: `${cycle.user.name || 'An employee'}'s 6-month rating cycle is approaching. Please review their goals and ratings.`,
                userId: reportingPersonId,
              },
            });
            remindersCreated++;
          }
        }
      }

      // Check if all goals for the employee have both selfScore and managerScore
      const employeeGoals = await prisma.goal.findMany({
        where: {
          employeeId: employeeId,
          status: { not: 'DELETED' },
        },
        include: {
          rating: {
            select: {
              selfScore: true,
              managerScore: true,
            },
          },
        },
      });

      // Only check completion if there are goals
      if (employeeGoals.length > 0) {
        const allRated = employeeGoals.every(
          (goal) =>
            goal.rating !== null &&
            goal.rating.selfScore !== null &&
            goal.rating.managerScore !== null
        );

        if (allRated) {
          // Check if RATING_CYCLE_COMPLETE notification already exists in last 30 days
          const existingCompletion = await prisma.notification.findFirst({
            where: {
              type: NotificationType.RATING_CYCLE_COMPLETE,
              userId: employeeId,
              createdAt: { gte: thirtyDaysAgo },
            },
          });

          if (!existingCompletion) {
            // Create completion notification for employee
            await prisma.notification.create({
              data: {
                type: NotificationType.RATING_CYCLE_COMPLETE,
                message: `All your goals have been rated. Your rating cycle is complete.`,
                userId: employeeId,
              },
            });
            completionsCreated++;

            // Create completion notification for reporting person if exists
            if (reportingPersonId) {
              await prisma.notification.create({
                data: {
                  type: NotificationType.RATING_CYCLE_COMPLETE,
                  message: `${cycle.user.name || 'An employee'}'s rating cycle is complete. All goals have been rated.`,
                  userId: reportingPersonId,
                },
              });
              completionsCreated++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      checked: reviewCycles.length,
      remindersCreated,
      completionsCreated,
    });
  } catch (error) {
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return handleApiError(error);
  }
}
