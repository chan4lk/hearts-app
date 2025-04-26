import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateGoalSuggestions } from '@/lib/openai';
import { z } from 'zod';

const requestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  context: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { category, context } = validationResult.data;

    const suggestions = await generateGoalSuggestions(
      category,
      session.user.role,
      context
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate goal suggestions' },
      { status: 500 }
    );
  }
} 