import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  db.sync();
  const agents = db.users
    .filter((u) => u.role === 'agent')
    .map(({ password, ...user }) => {
      const assignedLeadsCount = db.leads.filter(
        (l) => l.assigned_agent === user.id || (l.assigned_agent as any)?.id === user.id
      ).length;
      return {
        ...user,
        leads_count: assignedLeadsCount,
      };
    });

  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  try {
    db.sync();
    const body = await req.json();
    const { username, email, phone, first_name, last_name, password } = body;

    if (!username || !email) {
      return NextResponse.json({ detail: 'Username and Email are required.' }, { status: 400 });
    }

    const existing = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return NextResponse.json({ detail: 'An agent with this username or email already exists.' }, { status: 400 });
    }

    const newId = db.users.length > 0 ? Math.max(...db.users.map((u) => Number(u.id) || 0)) + 1 : 1;

    const newAgent = {
      id: newId,
      username: username.trim(),
      password: password || 'agent123',
      email: email.trim(),
      first_name: (first_name || '').trim(),
      last_name: (last_name || '').trim(),
      role: 'agent' as const,
      phone: (phone || '').trim(),
      is_active: true,
    };

    db.users.push(newAgent);

    db.auditLogs.unshift({
      id: Date.now(),
      user: 1,
      action: 'create',
      entity_type: 'User',
      entity_id: String(newAgent.id),
      description: `Created Sales Agent ${newAgent.username} (${newAgent.first_name} ${newAgent.last_name})`,
      created_at: new Date().toISOString(),
    });

    db.save();

    const { password: _, ...sanitized } = newAgent;
    return NextResponse.json(sanitized, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create agent account.' }, { status: 400 });
  }
}
