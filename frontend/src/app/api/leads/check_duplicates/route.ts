import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || '';

  if (!phone) {
    return NextResponse.json({ error: 'phone parameter required' }, { status: 400 });
  }

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const matches = db.leads.filter((l) => {
    const p = l.phone_primary.replace(/\D/g, '').slice(-10);
    return p === cleanPhone;
  });

  const formatted = matches.map((m) => {
    const agent = db.users.find((u) => u.id === m.assigned_agent);
    return {
      id: m.id,
      full_name: m.full_name,
      phone_primary: m.phone_primary,
      status: m.status,
      assigned_agent__username: agent?.username || 'Unassigned',
    };
  });

  return NextResponse.json(formatted);
}
