import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const project = searchParams.get('project');
  const status = searchParams.get('status');
  const plotType = searchParams.get('plot_type');

  let results = [...db.plots];

  if (project) results = results.filter((p) => String(p.project) === project);
  if (status) results = results.filter((p) => p.status === status);
  if (plotType) results = results.filter((p) => p.plot_type === plotType);

  const payload = results.map((plot) => {
    const proj = db.projects.find((p) => p.id === plot.project);
    return {
      ...plot,
      project_name: proj ? proj.name : plot.project_name || 'General Project',
    };
  });

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const proj = db.projects.find((p) => p.id === Number(body.project));

    const newPlot = {
      id: db.plots.length > 0 ? Math.max(...db.plots.map((p) => p.id)) + 1 : 1,
      project: Number(body.project) || 1,
      project_name: proj ? proj.name : 'General Project',
      plot_number: body.plot_number,
      block_sector: body.block_sector || '',
      area_sqft: Number(body.area_sqft) || 1000,
      plot_type: body.plot_type || 'residential',
      facing: body.facing || 'east',
      price_per_sqft: Number(body.price_per_sqft) || 2000,
      total_price: Number(body.total_price) || (Number(body.area_sqft) || 1000) * (Number(body.price_per_sqft) || 2000),
      status: (body.status as 'available' | 'reserved' | 'sold') || 'available',
      dimensions: body.dimensions || '',
      amenities: body.amenities || '',
      created_at: new Date().toISOString(),
    };

    db.plots.unshift(newPlot);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'Plot',
      entity_id: String(newPlot.id),
      description: `Created Plot ${newPlot.plot_number} (${newPlot.project_name})`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(newPlot, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create plot' }, { status: 400 });
  }
}
