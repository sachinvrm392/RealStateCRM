import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  const payload = db.projects.map((proj) => {
    const total_plots = db.plots.filter((p) => p.project === proj.id).length;
    return {
      ...proj,
      total_plots,
    };
  });
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newProj = {
      id: db.projects.length > 0 ? Math.max(...db.projects.map((p) => p.id)) + 1 : 1,
      name: body.name,
      location: body.location || '',
      description: body.description || '',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    db.projects.push(newProj);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'Project',
      entity_id: String(newProj.id),
      description: `Created Project ${newProj.name}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(newProj, { status: 201 });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create project' }, { status: 400 });
  }
}
