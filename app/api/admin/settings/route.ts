export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET system settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system settings from database
    const settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        notificationSettings: {
          emailNotifications: true,
          goalReminders: true,
          reviewReminders: true,
        },
        reviewSettings: {
          goalReviewPeriod: 30,
          performanceReviewPeriod: 90,
          selfReviewEnabled: true,
        },
        securitySettings: {
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumbers: true,
          },
          sessionTimeout: 30,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// UPDATE system settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { systemName, theme } = body;

    if (!systemName || !theme) {
      return NextResponse.json(
        { error: 'System name and theme are required' },
        { status: 400 }
      );
    }

    // Update or create system settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {
        securitySettings: {
          systemName,
          theme,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumbers: true,
          },
          sessionTimeout: 30,
        },
        notificationSettings: {
          emailNotifications: true,
          goalReminders: true,
          reviewReminders: true,
        },
        reviewSettings: {
          goalReviewPeriod: 30,
          performanceReviewPeriod: 90,
          selfReviewEnabled: true,
        }
      },
      create: {
        id: 1,
        securitySettings: {
          systemName,
          theme,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumbers: true,
          },
          sessionTimeout: 30,
        },
        notificationSettings: {
          emailNotifications: true,
          goalReminders: true,
          reviewReminders: true,
        },
        reviewSettings: {
          goalReviewPeriod: 30,
          performanceReviewPeriod: 90,
          selfReviewEnabled: true,
        }
      }
    });

    return NextResponse.json({
      systemName,
      theme,
      ...settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
} 