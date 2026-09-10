import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST() {
  db.notifications.forEach((n) => {
    n.is_read = true;
  });
  return NextResponse.json({ success: true });
}
