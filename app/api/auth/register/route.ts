import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

function clientKey(req: NextRequest, email?: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  return `auth:register:${ip}:${(email || '').toLowerCase()}`;
}

export async function POST(req: NextRequest) {
  let email: string | undefined;

  try {
    const body = await req.json();
    email = body?.email;

    const limited = checkRateLimit(clientKey(req, email), 3, 60 * 60 * 1000);
    if (limited) return limited;

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email: normalizedEmail, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        tenantId: 'bistec-global',
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'EMPLOYEE',
      },
    });

    const { password: _pw, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    logger.error('auth.register.failed', {
      email: email?.toLowerCase(),
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ message: 'Error creating user' }, { status: 500 });
  }
}
