import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Prisma client with ReviewCycle model
import { NotificationType } from '@prisma/client';

// GET all review cycles
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviewCycles = await prisma.reviewCycle.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        reportingPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(reviewCycles);
  } catch (error) {
    console.error('Error fetching review cycles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create or update review cycle
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, userId, reportingPersonId, jobCategory, designation, dateOfAppointment, after6Months, reviewMonth, adjustedReviewMonth } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse date if provided
    let parsedDateOfAppointment: Date | null = null;
    if (dateOfAppointment) {
      parsedDateOfAppointment = new Date(dateOfAppointment);
      if (isNaN(parsedDateOfAppointment.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }

    let reviewCycle;

    // If id is provided, update existing review cycle by ID
    if (id) {
      // Check if review cycle exists
      const existing = await prisma.reviewCycle.findUnique({
        where: { id }
      });

      if (!existing) {
        return NextResponse.json({ error: 'Review cycle not found' }, { status: 404 });
      }

      // If userId is being changed, check if new user already has a review cycle
      if (userId && userId !== existing.userId) {
        const existingUserCycle = await prisma.reviewCycle.findUnique({
          where: { userId }
        });
        if (existingUserCycle && existingUserCycle.id !== id) {
          return NextResponse.json({ error: 'User already has a review cycle' }, { status: 400 });
        }
      }

      // Update existing review cycle
      reviewCycle = await prisma.reviewCycle.update({
        where: { id },
        data: {
          userId: userId || existing.userId,
          reportingPersonId: reportingPersonId || null,
          jobCategory: jobCategory || null,
          designation: designation || null,
          dateOfAppointment: parsedDateOfAppointment,
          after6Months: after6Months || null,
          reviewMonth: reviewMonth || null,
          adjustedReviewMonth: adjustedReviewMonth || null,
          updatedById: session.user.id,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reportingPerson: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create notification for the employee when review cycle is updated
      await prisma.notification.create({
        data: {
          type: NotificationType.REVIEW_CYCLE_UPDATED,
          message: `Your review cycle information has been updated by ${session.user.name || 'Admin'}`,
          userId: reviewCycle.user.id,
        },
      });
    } else {
      // Check if review cycle already exists for this user
      const existingCycle = await prisma.reviewCycle.findUnique({
        where: { userId },
        select: { id: true, createdAt: true }
      });

      const isNew = !existingCycle;

      // Create or update review cycle (upsert by userId)
      reviewCycle = await prisma.reviewCycle.upsert({
        where: { userId },
        update: {
          reportingPersonId: reportingPersonId || null,
          jobCategory: jobCategory || null,
          designation: designation || null,
          dateOfAppointment: parsedDateOfAppointment,
          after6Months: after6Months || null,
          reviewMonth: reviewMonth || null,
          adjustedReviewMonth: adjustedReviewMonth || null,
          updatedById: session.user.id,
          updatedAt: new Date()
        },
        create: {
          userId,
          reportingPersonId: reportingPersonId || null,
          jobCategory: jobCategory || null,
          designation: designation || null,
          dateOfAppointment: parsedDateOfAppointment,
          after6Months: after6Months || null,
          reviewMonth: reviewMonth || null,
          adjustedReviewMonth: adjustedReviewMonth || null,
          updatedById: session.user.id
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          reportingPerson: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Create notification for the employee
      await prisma.notification.create({
        data: {
          type: isNew ? NotificationType.REVIEW_CYCLE_CREATED : NotificationType.REVIEW_CYCLE_UPDATED,
          message: isNew 
            ? `Your review cycle has been created by ${session.user.name || 'Admin'}`
            : `Your review cycle information has been updated by ${session.user.name || 'Admin'}`,
          userId: reviewCycle.user.id,
        },
      });

      // Also notify reporting person if assigned (only on create or if reporting person changed)
      if (reviewCycle.reportingPersonId && (isNew || !existingCycle || existingCycle.id !== reviewCycle.id)) {
        await prisma.notification.create({
          data: {
            type: NotificationType.REVIEW_CYCLE_UPDATED,
            message: `You have been assigned as reporting person for ${reviewCycle.user.name}'s review cycle`,
            userId: reviewCycle.reportingPersonId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, reviewCycle });
  } catch (error) {
    console.error('Error creating/updating review cycle:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save review cycle';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Delete review cycle
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review cycle ID is required' }, { status: 400 });
    }

    // Check if review cycle exists and get user info
    const existing = await prisma.reviewCycle.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Review cycle not found' }, { status: 404 });
    }

    // Store user info before deletion
    const userId = existing.userId;
    const userName = existing.user.name;

    // Delete the review cycle
    await prisma.reviewCycle.delete({
      where: { id }
    });

    // Create notification for the employee when review cycle is deleted
    await prisma.notification.create({
      data: {
        type: NotificationType.REVIEW_CYCLE_DELETED,
        message: `Your review cycle has been deleted by ${session.user.name || 'Admin'}`,
        userId: userId,
      },
    });

    return NextResponse.json({ success: true, message: 'Review cycle deleted successfully' });
  } catch (error) {
    console.error('Error deleting review cycle:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete review cycle';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

