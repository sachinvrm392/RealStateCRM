import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const notifId = Number(params.id);
  const notif = db.notifications.find((n) => n.id === notifId);

  if (notif) {
    notif.is_read = true;
  }

  return NextResponse.json({ success: true, notification: notif });
}
