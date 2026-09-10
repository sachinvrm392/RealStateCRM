import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const headers = 'ID,Project,Plot Number,Sector/Block,Type,Area (SqFt),Facing,Price/SqFt,Total Price,Status\n';
  const rows = db.plots.map((p) => {
    const proj = db.projects.find((pr) => pr.id === p.project);
    return `"${p.id}","${proj ? proj.name : p.project}","${p.plot_number}","${p.block_sector || ''}","${p.plot_type}","${p.area_sqft}","${p.facing}","${p.price_per_sqft}","${p.total_price}","${p.status}"`;
  });

  const csv = headers + rows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="plots_export.csv"',
    },
  });
}
