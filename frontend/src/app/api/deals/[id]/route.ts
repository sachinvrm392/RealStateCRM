import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const dealId = Number(params.id);
  const deal = db.deals.find((d) => d.id === dealId);

  if (!deal) {
    return NextResponse.json({ detail: 'Deal not found' }, { status: 404 });
  }

  const lead = db.leads.find((l) => l.id === deal.lead);
  const plot = db.plots.find((p) => p.id === deal.plot);
  const milestones = db.milestones.filter((m) => m.deal === deal.id);

  return NextResponse.json({
    ...deal,
    lead_name: lead ? lead.full_name : `Lead #${deal.lead}`,
    lead_phone: lead ? lead.phone_primary : '',
    lead_email: lead ? lead.email : '',
    plot_number: plot ? plot.plot_number : `Plot #${deal.plot}`,
    plot_sector: plot ? plot.block_sector : '',
    plot_area: plot ? plot.area_sqft : 0,
    plot_facing: plot ? plot.facing : '',
    milestones,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const dealId = Number(params.id);
  const deal = db.deals.find((d) => d.id === dealId);

  if (!deal) {
    return NextResponse.json({ detail: 'Deal not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const oldStatus = deal.status;
    Object.assign(deal, body);

    const plot = db.plots.find((p) => p.id === deal.plot);
    const lead = db.leads.find((l) => l.id === deal.lead);

    if (body.status === 'confirmed') {
      if (plot) plot.status = 'sold';
      if (lead) lead.status = 'deal_confirmed';
    } else if (body.status === 'cancelled') {
      if (plot) plot.status = 'available';
      if (lead) lead.status = 'lost';
    }

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'update',
      entity_type: 'Deal',
      entity_id: String(deal.id),
      description: `Updated Deal #${deal.id} status from ${oldStatus} to ${deal.status}`,
      created_at: new Date().toISOString(),
    });

    const milestones = db.milestones.filter((m) => m.deal === deal.id);
    return NextResponse.json({
      ...deal,
      lead_name: lead ? lead.full_name : `Lead #${deal.lead}`,
      plot_number: plot ? plot.plot_number : `Plot #${deal.plot}`,
      milestones,
    });
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to update deal' }, { status: 400 });
  }
}
