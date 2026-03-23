import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // Rate limit login attempts to prevent brute force
  const rateLimitResponse = await rateLimiters.strict(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Your account has been deactivated' }, { status: 403 });
    }

    const isValidPassword = await compare(password, user.password);
    if (!isValidPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
          lastLoginAttempt: new Date(),
        },
      });
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAttempt: new Date(),
        lastLoginAt: new Date(),
      },
    });

    // NextAuth handles session/token — no separate JWT needed
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) { // handled silently
    logger.error(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: 'Error during login' }, { status: 500 });
  }
}
