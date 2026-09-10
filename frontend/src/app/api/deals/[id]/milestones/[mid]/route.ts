import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';

export async function PATCH(req: Request, { params }: { params: { id: string; mid: string } }) {
  const milestoneId = Number(params.mid);
  const milestone = db.milestones.find((m) => m.id === milestoneId);

  if (!milestone) {
    return NextResponse.json({ detail: 'Milestone not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    Object.assign(milestone, body);
    return NextResponse.json(milestone);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update milestone' }, { status: 400 });
  }
}
