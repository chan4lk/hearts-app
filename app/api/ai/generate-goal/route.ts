import { NextResponse } from 'next/server';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt, category } = await req.json();

    if (!prompt || !category) {
      return NextResponse.json(
        { error: 'Prompt and category are required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional goal-setting assistant. Create a SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goal based on the user's input and category. The goal should be professional, actionable, and aligned with the specified category. Format the response as a JSON object with 'title' and 'description' fields.`
        },
        {
          role: "user",
          content: `Create a goal in the ${category} category based on this prompt: ${prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from AI');

    const goalData = JSON.parse(response);
    return NextResponse.json(goalData);
  } catch (error) {
    console.error('Error generating goal:', error);
    return NextResponse.json(
      { error: 'Failed to generate goal' },
      { status: 500 }
    );
  }
} 