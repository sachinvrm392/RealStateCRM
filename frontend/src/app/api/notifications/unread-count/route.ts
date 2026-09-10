import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const count = db.notifications.filter((n) => !n.is_read).length;
  return NextResponse.json({ count });
}
