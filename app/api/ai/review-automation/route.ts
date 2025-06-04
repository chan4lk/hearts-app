import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ error: 'Review automation is not available.' }, { status: 501 });
}
