import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  const sanitized = db.users.map(({ password, ...rest }) => rest);
  return NextResponse.json(sanitized);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const existing = db.users.find((u) => u.username === body.username);
    if (existing) {
      return NextResponse.json({ detail: 'A user with that username already exists.' }, { status: 400 });
    }

    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
      username: body.username,
      password: body.password || 'agent123',
      email: body.email || '',
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      role: body.role || 'agent',
      phone: body.phone || '',
      is_active: true,
    };

    db.users.push(newUser);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'User',
      entity_id: String(newUser.id),
      description: `Created User ${newUser.username} (${newUser.role})`,
      created_at: new Date().toISOString(),
    });

    const { password, ...rest } = newUser;
    return NextResponse.json(rest, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create user' }, { status: 400 });
  }
}
