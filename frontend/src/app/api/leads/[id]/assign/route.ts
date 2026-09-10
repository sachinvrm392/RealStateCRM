import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const agentId = Number(body.agent_id || body.assigned_agent);
    const agent = db.users.find((u) => u.id === agentId);

    lead.assigned_agent = agentId;

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'assignment',
      entity_type: 'Lead',
      entity_id: String(lead.id),
      description: `Reassigned Lead ${lead.full_name} to ${agent ? agent.username : agentId}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ...lead,
      assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
    });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to assign agent' }, { status: 400 });
  }
}
