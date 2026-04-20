import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';

function clientKey(req: NextRequest, email?: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  return `auth:login:${ip}:${(email || '').toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  let email: string | undefined;
  let password: string | undefined;

  try {
    const body = await req.json();
    email = body?.email;
    password = body?.password;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const limited = checkRateLimit(clientKey(req, email), 5, 15 * 60 * 1000);
    if (limited) return limited;

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Your account has been deactivated' }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json({ message: 'This account uses Azure AD login' }, { status: 401 });
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAttempt: new Date(),
        lastLoginAt: new Date(),
      },
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('[auth/login] error', {
      email: email?.toLowerCase(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ message: 'Error during login' }, { status: 500 });
  }
}
