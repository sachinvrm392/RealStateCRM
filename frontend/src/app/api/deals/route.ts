import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let results = [...db.deals];
  if (status) results = results.filter((d) => d.status === status);

  const payload = results.map((deal) => {
    const lead = db.leads.find((l) => l.id === deal.lead);
    const plot = db.plots.find((p) => p.id === deal.plot);
    const milestones = db.milestones.filter((m) => m.deal === deal.id);
    return {
      ...deal,
      lead_name: lead ? lead.full_name : `Lead #${deal.lead}`,
      plot_number: plot ? plot.plot_number : `Plot #${deal.plot}`,
      milestones,
    };
  });

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leadId = Number(body.lead);
    const plotId = Number(body.plot);
    const dealAmount = Number(body.deal_amount) || 0;
    const discount = Number(body.discount) || 0;
    const finalAmount = Number(body.final_amount) || dealAmount - discount;

    const lead = db.leads.find((l) => l.id === leadId);
    const plot = db.plots.find((p) => p.id === plotId);

    const newDeal = {
      id: db.deals.length > 0 ? Math.max(...db.deals.map((d) => d.id)) + 1 : 1,
      lead: leadId,
      plot: plotId,
      booking_date: body.booking_date || new Date().toISOString().split('T')[0],
      deal_amount: dealAmount,
      discount: discount,
      final_amount: finalAmount,
      status: (body.status as 'booked' | 'confirmed' | 'cancelled') || 'booked',
      notes: body.notes || '',
      created_by: 1,
      created_at: new Date().toISOString(),
    };

    db.deals.unshift(newDeal);

    if (plot) plot.status = 'reserved';
    if (lead) lead.status = 'booked';

    const tokenAmount = Math.round(finalAmount * 0.1);
    const downPaymentAmount = Math.round(finalAmount * 0.25);
    const balanceAmount = finalAmount - tokenAmount - downPaymentAmount;
    const baseDate = new Date(newDeal.booking_date);

    const m1 = {
      id: db.milestones.length > 0 ? Math.max(...db.milestones.map((m) => m.id)) + 1 : 1,
      deal: newDeal.id,
      milestone_type: 'token',
      amount: tokenAmount,
      due_date: newDeal.booking_date,
      paid_date: newDeal.booking_date,
      is_paid: true,
      notes: 'Initial Booking Token',
      created_at: new Date().toISOString(),
    };
    db.milestones.push(m1);

    const d2 = new Date(baseDate.getTime() + 15 * 86400000).toISOString().split('T')[0];
    const m2 = {
      id: db.milestones.length + 1,
      deal: newDeal.id,
      milestone_type: 'down_payment',
      amount: downPaymentAmount,
      due_date: d2,
      paid_date: null,
      is_paid: false,
      notes: 'Agreement Down Payment (25%)',
      created_at: new Date().toISOString(),
    };
    db.milestones.push(m2);

    const d3 = new Date(baseDate.getTime() + 45 * 86400000).toISOString().split('T')[0];
    const m3 = {
      id: db.milestones.length + 1,
      deal: newDeal.id,
      milestone_type: 'full_payment',
      amount: balanceAmount,
      due_date: d3,
      paid_date: null,
      is_paid: false,
      notes: 'Registry Balance Clearance',
      created_at: new Date().toISOString(),
    };
    db.milestones.push(m3);

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'Deal',
      entity_id: String(newDeal.id),
      description: `Booked Deal #${newDeal.id} for Plot ${plot ? plot.plot_number : plotId} (${lead ? lead.full_name : leadId})`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        ...newDeal,
        lead_name: lead ? lead.full_name : `Lead #${newDeal.lead}`,
        plot_number: plot ? plot.plot_number : `Plot #${newDeal.plot}`,
        milestones: [m1, m2, m3],
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create deal' }, { status: 400 });
  }
}
