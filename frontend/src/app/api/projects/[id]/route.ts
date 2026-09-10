import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const projId = Number(params.id);
  const proj = db.projects.find((p) => p.id === projId);

  if (!proj) {
    return NextResponse.json({ detail: 'Project not found' }, { status: 404 });
  }

  const plots = db.plots.filter((p) => p.project === projId);
  return NextResponse.json({
    ...proj,
    plots,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const projId = Number(params.id);
  const proj = db.projects.find((p) => p.id === projId);

  if (!proj) {
    return NextResponse.json({ detail: 'Project not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    Object.assign(proj, body);
    return NextResponse.json(proj);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update project' }, { status: 400 });
  }
}
