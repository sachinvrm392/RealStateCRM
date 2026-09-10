import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET() {
  const headers = 'Deal ID,Lead Name,Plot Number,Booking Date,Deal Amount,Discount,Final Amount,Status\n';
  const rows = db.deals.map((d) => {
    const lead = db.leads.find((l) => l.id === d.lead);
    const plot = db.plots.find((p) => p.id === d.plot);
    return `"${d.id}","${lead ? lead.full_name : d.lead}","${plot ? plot.plot_number : d.plot}","${d.booking_date}","${d.deal_amount}","${d.discount}","${d.final_amount}","${d.status}"`;
  });

  const csv = headers + rows.join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="deals_export.csv"',
    },
  });
}
