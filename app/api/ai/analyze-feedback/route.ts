import { NextResponse } from 'next/server';
import { feedbackAnalysisChain } from '@/lib/langchain/feedbackAnalysisChain';

export async function POST(req: Request) {
  try {
    const { feedback } = await req.json();
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback is required' }, { status: 400 });
    }
    const result = await feedbackAnalysisChain.call({ feedback });
    let analysis;
    try {
      analysis = JSON.parse(result.text);
    } catch {
      analysis = { raw: result.text };
    }
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return NextResponse.json({ error: 'Failed to analyze feedback' }, { status: 500 });
  }
} 