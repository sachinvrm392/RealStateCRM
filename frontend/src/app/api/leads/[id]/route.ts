import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  const agent = db.users.find((u) => u.id === lead.assigned_agent);
  const proj = db.projects.find((p) => p.id === lead.interested_project);
  const calls = db.calls.filter((c) => c.lead === leadId);

  return NextResponse.json({
    ...lead,
    assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
    interested_project: proj ? { id: proj.id, name: proj.name, location: proj.location } : null,
    call_attempts: calls,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    if (body.status) {
      lead.status = body.status;
      db.auditLogs.unshift({
        id: db.auditLogs.length + 1,
        user: 1,
        action: 'status_change',
        entity_type: 'Lead',
        entity_id: String(lead.id),
        description: `Lead status changed to ${body.status}`,
        created_at: new Date().toISOString(),
      });
    }

    if (body.temperature) {
      lead.temperature = body.temperature;
    }

    if (body.assigned_agent) {
      lead.assigned_agent = Number(body.assigned_agent);
    }

    lead.updated_at = new Date().toISOString();

    const agent = db.users.find((u) => u.id === lead.assigned_agent);
    const proj = db.projects.find((p) => p.id === lead.interested_project);
    const calls = db.calls.filter((c) => c.lead === leadId);

    return NextResponse.json({
      ...lead,
      assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
      interested_project: proj ? { id: proj.id, name: proj.name, location: proj.location } : null,
      call_attempts: calls,
    });
  } catch (err) {
    return NextResponse.json({ detail: 'Update failed' }, { status: 400 });
  }
}
