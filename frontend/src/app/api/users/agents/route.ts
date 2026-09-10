import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const agents = db.users
    .filter((u) => u.role === 'agent' && u.is_active)
    .map(({ password, ...rest }) => rest);
  return NextResponse.json(agents);
}
