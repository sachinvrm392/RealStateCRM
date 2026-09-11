import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const id = Number(params.id);
  const agent = db.users.find((u) => u.id === id && u.role === 'agent');

  if (!agent) {
    return NextResponse.json({ detail: 'Agent not found' }, { status: 404 });
  }

  const assignedLeads = db.leads.filter(
    (l) => l.assigned_agent === agent.id || (l.assigned_agent as any)?.id === agent.id
  );

  const { password: _, ...sanitized } = agent;
  return NextResponse.json({
    ...sanitized,
    leads_count: assignedLeads.length,
    assigned_leads: assignedLeads,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    db.sync();
    const id = Number(params.id);
    const index = db.users.findIndex((u) => u.id === id && u.role === 'agent');

    if (index === -1) {
      return NextResponse.json({ detail: 'Agent not found' }, { status: 404 });
    }

    const body = await req.json();
    const agent = db.users[index];

    if (body.first_name !== undefined) agent.first_name = body.first_name;
    if (body.last_name !== undefined) agent.last_name = body.last_name;
    if (body.email !== undefined) agent.email = body.email;
    if (body.phone !== undefined) agent.phone = body.phone;
    if (body.is_active !== undefined) agent.is_active = Boolean(body.is_active);
    if (body.password) agent.password = body.password;

    db.auditLogs.unshift({
      id: Date.now(),
      user: 1,
      action: 'update',
      entity_type: 'User',
      entity_id: String(agent.id),
      description: `Updated Sales Agent ${agent.username}`,
      created_at: new Date().toISOString(),
    });

    db.save();

    const { password: _, ...sanitized } = agent;
    return NextResponse.json(sanitized);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update agent.' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    db.sync();
    const id = Number(params.id);
    const index = db.users.findIndex((u) => u.id === id && u.role === 'agent');

    if (index === -1) {
      return NextResponse.json({ detail: 'Agent not found' }, { status: 404 });
    }

    const removed = db.users.splice(index, 1)[0];

    db.auditLogs.unshift({
      id: Date.now(),
      user: 1,
      action: 'delete',
      entity_type: 'User',
      entity_id: String(id),
      description: `Deleted Agent account "${removed.username}"`,
      created_at: new Date().toISOString(),
    });

    db.save();

    return NextResponse.json({ detail: 'Agent deleted successfully' });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to delete agent.' }, { status: 400 });
  }
}
