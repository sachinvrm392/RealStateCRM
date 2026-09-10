import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const headers = [
    'ID', 'Full Name', 'Phone Primary', 'Phone Alternate', 'Email',
    'WhatsApp', 'Source', 'City', 'Status', 'Temperature', 'Created At'
  ];

  const rows = db.leads.map((l) => [
    l.id,
    `"${l.full_name}"`,
    `"${l.phone_primary}"`,
    `"${l.phone_alternate || ''}"`,
    `"${l.email || ''}"`,
    `"${l.whatsapp_number || ''}"`,
    l.source,
    `"${l.city || ''}"`,
    l.status,
    l.temperature,
    l.created_at,
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="leads_export.csv"',
    },
  });
}
