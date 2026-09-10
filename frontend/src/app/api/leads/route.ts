import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const temperature = searchParams.get('temperature');
  const source = searchParams.get('source');
  const search = searchParams.get('search')?.toLowerCase();

  let results = [...db.leads];

  if (status) results = results.filter((l) => l.status === status);
  if (temperature) results = results.filter((l) => l.temperature === temperature);
  if (source) results = results.filter((l) => l.source === source);
  if (search) {
    results = results.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(search) ||
        l.phone_primary?.includes(search) ||
        l.city?.toLowerCase().includes(search)
    );
  }

  // Format with nested agent and project objects
  const payload = results.map((lead) => {
    const agent = db.users.find((u) => u.id === lead.assigned_agent);
    const proj = db.projects.find((p) => p.id === lead.interested_project);
    return {
      ...lead,
      assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
      interested_project: proj ? { id: proj.id, name: proj.name, location: proj.location } : null,
    };
  });

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Auto round-robin assignment if unassigned
    let assigned_agent = body.assigned_agent ? Number(body.assigned_agent) : null;
    if (!assigned_agent) {
      const agents = db.users.filter((u) => u.role === 'agent');
      if (agents.length > 0) {
        // Find agent with fewest leads
        const agentLeadCounts = agents.map((ag) => ({
          agent: ag,
          count: db.leads.filter((l) => l.assigned_agent === ag.id).length,
        }));
        agentLeadCounts.sort((a, b) => a.count - b.count);
        assigned_agent = agentLeadCounts[0].agent.id;
      }
    }

    const newLead = {
      id: db.leads.length > 0 ? Math.max(...db.leads.map((l) => l.id)) + 1 : 1,
      full_name: body.full_name,
      phone_primary: body.phone_primary,
      phone_alternate: body.phone_alternate || '',
      email: body.email || '',
      whatsapp_number: body.whatsapp_number || '',
      source: body.source || 'other',
      city: body.city || '',
      interested_project: body.interested_project ? Number(body.interested_project) : null,
      budget_range: body.budget_range || '',
      plot_size_preference: body.plot_size_preference || '',
      notes: body.notes || '',
      status: 'new',
      temperature: body.temperature || 'unqualified',
      assigned_agent,
      created_at: new Date().toISOString(),
    };

    db.leads.unshift(newLead);

    // Audit log
    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'Lead',
      entity_id: String(newLead.id),
      description: `Created Lead ${newLead.full_name}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create lead' }, { status: 400 });
  }
}
