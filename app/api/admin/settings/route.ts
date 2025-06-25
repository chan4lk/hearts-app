import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

interface Settings {
  systemName: string;
  theme: string;
}

// Default settings
const defaultSettings: Settings = {
  systemName: 'Performance Management System',
  theme: 'dark',
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return default settings
    // In a real application, you might want to store these in a database
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedSettings: Partial<Settings> = body;

    // Validate settings
    if (updatedSettings.systemName && typeof updatedSettings.systemName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid systemName' },
        { status: 400 }
      );
    }

    if (updatedSettings.theme && !['light', 'dark'].includes(updatedSettings.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme' },
        { status: 400 }
      );
    }

    // For now, just return the updated settings
    // In a real application, you would save these to a database
    const newSettings = { ...defaultSettings, ...updatedSettings };
    
    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 