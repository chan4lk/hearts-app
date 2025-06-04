import { NextResponse } from 'next/server';
import { generateGoalSuggestions } from '@/lib/openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export async function POST(req: Request) {
  try {
    const { prompt, category } = await req.json();

    if (!prompt || !category) {
      return NextResponse.json(
        { error: 'Prompt and category are required' },
        { status: 400 }
      );
    }

    // Use the OpenAI helper to generate goals
    const goals = await generateGoalSuggestions(category, 'employee', prompt);
    if (!goals || goals.length === 0) {
      return NextResponse.json({ error: 'No goals generated' }, { status: 500 });
    }
    return NextResponse.json(goals[0]);
  } catch (error) {
    console.error('Error generating goal:', error);
    return NextResponse.json(
      { error: 'Failed to generate goal' },
      { status: 500 }
    );
  }
} 