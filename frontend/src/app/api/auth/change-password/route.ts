import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    let user = db.users[0]; // fallback

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

    if (!user || !user.is_active) {
      return NextResponse.json({ detail: 'Unauthorized. Please login again.' }, { status: 401 });
    }

    const body = await req.json();
    const { current_password, new_password, confirm_password } = body;

    if (!current_password || !new_password || !confirm_password) {
      return NextResponse.json({ detail: 'Please provide current password, new password, and confirm password.' }, { status: 400 });
    }

    // Check current password
    if (user.password && user.password !== current_password) {
      return NextResponse.json({ detail: 'Current password does not match.' }, { status: 400 });
    }

    // Validate length
    if (new_password.length < 6) {
      return NextResponse.json({ detail: 'New password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check confirmation
    if (new_password !== confirm_password) {
      return NextResponse.json({ detail: 'New password and confirmation do not match.' }, { status: 400 });
    }

    // Update password
    user.password = new_password;

    // Log in audit trail
    db.auditLogs.unshift({
      id: Date.now(),
      user: user.id,
      action: 'update',
      entity_type: 'User',
      entity_id: String(user.id),
      description: `User "${user.username}" changed their account password.`,
      created_at: new Date().toISOString(),
    });

    db.save();

    return NextResponse.json({ detail: 'Password updated successfully.' });
  } catch (error) {
    return NextResponse.json({ detail: 'An error occurred while changing password.' }, { status: 500 });
  }
}
