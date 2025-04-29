import { NextResponse } from 'next/server';
import { reviewAutomationChain } from '@/lib/langchain/reviewAutomationChain';

export async function POST(req: Request) {
  try {
    const { ratings, feedback } = await req.json();
    if (!ratings || !feedback) {
      return NextResponse.json({ error: 'Ratings and feedback are required' }, { status: 400 });
    }
    const result = await reviewAutomationChain.call({ ratings, feedback });
    let review;
    try {
      review = JSON.parse(result.text);
    } catch {
      review = { raw: result.text };
    }
    return NextResponse.json(review);
  } catch (error) {
    console.error('Error generating review:', error);
    return NextResponse.json({ error: 'Failed to generate review' }, { status: 500 });
  }
}
