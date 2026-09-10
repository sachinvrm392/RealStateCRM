import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const plotId = Number(params.id);
  const plot = db.plots.find((p) => p.id === plotId);

  if (!plot) {
    return NextResponse.json({ detail: 'Plot not found' }, { status: 404 });
  }

  const proj = db.projects.find((p) => p.id === plot.project);
  return NextResponse.json({
    ...plot,
    project_name: proj ? proj.name : plot.project_name || 'General Project',
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const plotId = Number(params.id);
  const plot = db.plots.find((p) => p.id === plotId);

  if (!plot) {
    return NextResponse.json({ detail: 'Plot not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    Object.assign(plot, body);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'update',
      entity_type: 'Plot',
      entity_id: String(plot.id),
      description: `Updated Plot ${plot.plot_number} status to ${plot.status}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(plot);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update plot' }, { status: 400 });
  }
}
