import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const callbacks = db.leads.filter((l) => l.next_callback_at).map((l) => {
    const agent = db.users.find((u) => u.id === l.assigned_agent);
    return {
      ...l,
      assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
    };
  });
  return NextResponse.json(callbacks);
}
