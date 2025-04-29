import { NextResponse } from 'next/server';
import { goalChain } from "@/lib/langchain/goalChain";

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

    const result = await goalChain.call({ prompt, category });

    // Try to parse the result as JSON
    let goalData;
    try {
      goalData = JSON.parse(result.text);
    } catch {
      // Fallback: return raw text if not valid JSON
      goalData = { raw: result.text };
    }

    return NextResponse.json(goalData);
  } catch (error) {
    console.error('Error generating goal:', error);
    return NextResponse.json(
      { error: 'Failed to generate goal' },
      { status: 500 }
    );
  }
} 