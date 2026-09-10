import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const dealId = Number(params.id);
  const milestones = db.milestones.filter((m) => m.deal === dealId);
  return NextResponse.json(milestones);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const dealId = Number(params.id);
    const body = await req.json();

    const newMilestone = {
      id: db.milestones.length > 0 ? Math.max(...db.milestones.map((m) => m.id)) + 1 : 1,
      deal: dealId,
      milestone_type: body.milestone_type || 'custom',
      amount: Number(body.amount) || 0,
      due_date: body.due_date || new Date().toISOString().split('T')[0],
      paid_date: body.is_paid ? new Date().toISOString().split('T')[0] : null,
      is_paid: Boolean(body.is_paid),
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    };

    db.milestones.push(newMilestone);

    return NextResponse.json(newMilestone, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to add milestone' }, { status: 400 });
  }
}
