import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const leadId = Number(params.id);
  const calls = db.calls.filter((c) => c.lead === leadId);
  return NextResponse.json(calls);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const outcome = String(formData.get('outcome') || 'connected');
    const notes = String(formData.get('notes') || '');
    const callback_scheduled_at = formData.get('callback_scheduled_at') ? String(formData.get('callback_scheduled_at')) : null;

    const newCall = {
      id: db.calls.length + 1,
      lead: leadId,
      agent: 3,
      agent_name: 'agent_rahul',
      outcome,
      notes,
      callback_scheduled_at,
      created_at: new Date().toISOString(),
    };

    db.calls.unshift(newCall);

    // Update lead timestamps
    lead.last_contacted_at = new Date().toISOString();
    if (outcome === 'callback_scheduled' && callback_scheduled_at) {
      lead.next_callback_at = callback_scheduled_at;
    }
    if (lead.status === 'new') {
      lead.status = 'contacted';
    }

    db.saveToFile();

    return NextResponse.json(newCall, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to log call' }, { status: 400 });
  }
}
