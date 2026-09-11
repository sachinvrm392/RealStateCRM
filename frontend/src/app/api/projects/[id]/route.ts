import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  db.sync();
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
  db.sync();
  const projId = Number(params.id);
  const proj = db.projects.find((p) => p.id === projId);

  if (!proj) {
    return NextResponse.json({ detail: 'Project not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    Object.assign(proj, body);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'update',
      entity_type: 'Project',
      entity_id: String(proj.id),
      description: `Updated Project ${proj.name}`,
      created_at: new Date().toISOString(),
    });

    db.saveToFile();
    return NextResponse.json(proj);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update project' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const projId = Number(params.id);
  const index = db.projects.findIndex((p) => p.id === projId);

  if (index === -1) {
    return NextResponse.json({ detail: 'Project not found' }, { status: 404 });
  }

  const removed = db.projects.splice(index, 1)[0];

  db.auditLogs.unshift({
    id: db.auditLogs.length + 1,
    user: 1,
    action: 'delete',
    entity_type: 'Project',
    entity_id: String(projId),
    description: `Deleted Project ${removed.name}`,
    created_at: new Date().toISOString(),
  });

  db.saveToFile();
  return NextResponse.json({ message: 'Project deleted successfully', id: projId });
}
