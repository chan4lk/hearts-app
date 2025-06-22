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

    let settings = await prisma.systemSettings.findFirst({ where: { id: 1 } });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 1,
          systemName: 'Performance Management System',
          theme: 'dark',
          notificationSettings: {},
          reviewSettings: {},
          securitySettings: {},
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

    const updatedSettings = await prisma.systemSettings.update({
      where: { id: 1 },
      data: {
        systemName,
        theme,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
} 