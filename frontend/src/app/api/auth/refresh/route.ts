import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refresh } = body;
    if (!refresh) {
      return NextResponse.json({ detail: 'Refresh token required' }, { status: 400 });
    }
    const access = refresh.replace('rf.', 'ey.');
    return NextResponse.json({ access });
  } catch (err) {
    return NextResponse.json({ detail: 'Invalid token' }, { status: 400 });
  }
}
