import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  let user = db.users[0]; // Default to super admin if token parses

  if (token.startsWith('ey.')) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const found = db.users.find((u) => u.id === payload.user_id || u.username === payload.username);
      if (found) user = found;
    } catch (e) {
      // fallback
    }
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    phone: user.phone,
  });
}
