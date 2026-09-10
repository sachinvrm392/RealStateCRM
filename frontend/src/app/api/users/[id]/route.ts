import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = Number(params.id);
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return NextResponse.json({ detail: 'User not found' }, { status: 404 });
  }

  const { password, ...rest } = user;
  return NextResponse.json(rest);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = Number(params.id);
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return NextResponse.json({ detail: 'User not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    Object.assign(user, body);

    const { password, ...rest } = user;
    return NextResponse.json(rest);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update user' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = Number(params.id);
  const index = db.users.findIndex((u) => u.id === userId);

  if (index !== -1) {
    db.users.splice(index, 1);
  }

  return NextResponse.json({ detail: 'User deleted' });
}
