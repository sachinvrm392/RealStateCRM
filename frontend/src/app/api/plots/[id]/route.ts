import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  db.sync();
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
  db.sync();
  const plotId = Number(params.id);
  const plot = db.plots.find((p) => p.id === plotId);

  if (!plot) {
    return NextResponse.json({ detail: 'Plot not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    if (body.project) body.project = Number(body.project);
    if (body.area_sqft) body.area_sqft = Number(body.area_sqft);
    if (body.price_per_sqft) body.price_per_sqft = Number(body.price_per_sqft);
    if (body.total_price) body.total_price = Number(body.total_price);

    const proj = body.project ? db.projects.find((p) => p.id === body.project) : null;
    if (proj) {
      body.project_name = proj.name;
    }

    Object.assign(plot, body);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'update',
      entity_type: 'Plot',
      entity_id: String(plot.id),
      description: `Updated Plot ${plot.plot_number} (status: ${plot.status})`,
      created_at: new Date().toISOString(),
    });

    db.saveToFile();

    return NextResponse.json(plot);
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update plot' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const plotId = Number(params.id);
  const index = db.plots.findIndex((p) => p.id === plotId);

  if (index === -1) {
    return NextResponse.json({ detail: 'Plot not found' }, { status: 404 });
  }

  const removed = db.plots.splice(index, 1)[0];

  db.auditLogs.unshift({
    id: db.auditLogs.length + 1,
    user: 1,
    action: 'delete',
    entity_type: 'Plot',
    entity_id: String(plotId),
    description: `Deleted Plot ${removed.plot_number}`,
    created_at: new Date().toISOString(),
  });

  db.saveToFile();

  return NextResponse.json({ message: 'Plot deleted successfully', id: plotId });
}
