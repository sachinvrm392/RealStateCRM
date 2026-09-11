import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET(req: Request) {
  db.sync();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  // Auto-sync: Ensure every lead with status 'booked' or 'deal_confirmed' has a corresponding Deal in db.deals
  const convertedLeads = db.leads.filter(
    (l) => l.status === 'booked' || l.status === 'deal_confirmed'
  );

  let updated = false;
  for (const lead of convertedLeads) {
    const existingDeal = db.deals.find((d) => d.lead === lead.id);
    const isConfirmed = lead.status === 'deal_confirmed';

    if (!existingDeal) {
      // Find an available plot (prefer lead's interested project if specified)
      let plot = db.plots.find(
        (p) => (lead.interested_project ? p.project === lead.interested_project : true) && p.status === 'available'
      );
      if (!plot) {
        plot = db.plots.find((p) => p.status === 'available') || db.plots[0];
      }

      const dealAmount = plot ? plot.total_price : 3500000;
      const finalAmount = dealAmount;

      const autoDeal = {
        id: db.deals.length > 0 ? Math.max(...db.deals.map((d) => d.id)) + 1 : 1,
        lead: lead.id,
        plot: plot ? plot.id : 1,
        booking_date: new Date().toISOString().split('T')[0],
        deal_amount: dealAmount,
        discount: 0,
        final_amount: finalAmount,
        status: (isConfirmed ? 'confirmed' : 'booked') as 'booked' | 'confirmed' | 'cancelled',
        notes: `Converted from Lead ${lead.full_name} (${isConfirmed ? 'Deal Confirmed' : 'Booked'})`,
        created_by: 1,
        created_at: new Date().toISOString(),
      };

      db.deals.unshift(autoDeal);
      updated = true;

      if (plot) {
        plot.status = isConfirmed ? 'sold' : 'reserved';
      }

      // Generate default milestones
      const tokenAmount = Math.round(finalAmount * 0.1);
      const downPaymentAmount = Math.round(finalAmount * 0.25);
      const balanceAmount = finalAmount - tokenAmount - downPaymentAmount;

      const m1 = {
        id: db.milestones.length > 0 ? Math.max(...db.milestones.map((m) => m.id)) + 1 : 1,
        deal: autoDeal.id,
        milestone_type: 'token',
        amount: tokenAmount,
        due_date: autoDeal.booking_date,
        paid_date: autoDeal.booking_date,
        is_paid: true,
        notes: 'Initial Booking Token',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m1);

      const d2 = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const m2 = {
        id: db.milestones.length + 1,
        deal: autoDeal.id,
        milestone_type: 'down_payment',
        amount: downPaymentAmount,
        due_date: d2,
        paid_date: isConfirmed ? autoDeal.booking_date : null,
        is_paid: isConfirmed,
        notes: 'Agreement Down Payment (25%)',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m2);

      const d3 = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
      const m3 = {
        id: db.milestones.length + 1,
        deal: autoDeal.id,
        milestone_type: 'full_payment',
        amount: balanceAmount,
        due_date: d3,
        paid_date: isConfirmed ? autoDeal.booking_date : null,
        is_paid: isConfirmed,
        notes: 'Registry Balance Clearance',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m3);

      db.auditLogs.unshift({
        id: db.auditLogs.length + 1,
        user: 1,
        action: 'create',
        entity_type: 'Deal',
        entity_id: String(autoDeal.id),
        description: `Auto-created Deal #${autoDeal.id} for converted Lead ${lead.full_name}`,
        created_at: new Date().toISOString(),
      });
    } else {
      // Sync status if needed
      if (isConfirmed && existingDeal.status !== 'confirmed') {
        existingDeal.status = 'confirmed';
        const plot = db.plots.find((p) => p.id === existingDeal.plot);
        if (plot) plot.status = 'sold';
        updated = true;
      }
    }
  }

  if (updated) {
    db.saveToFile();
  }

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
    db.sync();
    const body = await req.json();
    const leadId = Number(body.lead);
    const plotId = Number(body.plot);
    const dealAmount = Number(body.deal_amount) || 0;
    const discount = Number(body.discount) || 0;
    const finalAmount = Number(body.final_amount) || dealAmount - discount;

    const lead = db.leads.find((l) => l.id === leadId);
    const plot = db.plots.find((p) => p.id === plotId);

    // If a deal already exists for this lead and plot, update it
    const existingIndex = db.deals.findIndex((d) => d.lead === leadId && d.plot === plotId);

    const dealStatus = (body.status as 'booked' | 'confirmed' | 'cancelled') || 'booked';

    let savedDeal;
    if (existingIndex !== -1) {
      savedDeal = db.deals[existingIndex];
      savedDeal.deal_amount = dealAmount;
      savedDeal.discount = discount;
      savedDeal.final_amount = finalAmount;
      savedDeal.status = dealStatus;
      savedDeal.notes = body.notes || savedDeal.notes;
    } else {
      savedDeal = {
        id: db.deals.length > 0 ? Math.max(...db.deals.map((d) => d.id)) + 1 : 1,
        lead: leadId,
        plot: plotId,
        booking_date: body.booking_date || new Date().toISOString().split('T')[0],
        deal_amount: dealAmount,
        discount: discount,
        final_amount: finalAmount,
        status: dealStatus,
        notes: body.notes || '',
        created_by: 1,
        created_at: new Date().toISOString(),
      };
      db.deals.unshift(savedDeal);
    }

    if (plot) {
      plot.status = dealStatus === 'confirmed' ? 'sold' : 'reserved';
    }

    if (lead) {
      lead.status = dealStatus === 'confirmed' ? 'deal_confirmed' : 'booked';
    }

    const tokenAmount = Math.round(finalAmount * 0.1);
    const downPaymentAmount = Math.round(finalAmount * 0.25);
    const balanceAmount = finalAmount - tokenAmount - downPaymentAmount;
    const baseDate = new Date(savedDeal.booking_date);

    let milestones = db.milestones.filter((m) => m.deal === savedDeal.id);
    if (milestones.length === 0) {
      const m1 = {
        id: db.milestones.length > 0 ? Math.max(...db.milestones.map((m) => m.id)) + 1 : 1,
        deal: savedDeal.id,
        milestone_type: 'token',
        amount: tokenAmount,
        due_date: savedDeal.booking_date,
        paid_date: savedDeal.booking_date,
        is_paid: true,
        notes: 'Initial Booking Token',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m1);

      const d2 = new Date(baseDate.getTime() + 15 * 86400000).toISOString().split('T')[0];
      const m2 = {
        id: db.milestones.length + 1,
        deal: savedDeal.id,
        milestone_type: 'down_payment',
        amount: downPaymentAmount,
        due_date: d2,
        paid_date: dealStatus === 'confirmed' ? savedDeal.booking_date : null,
        is_paid: dealStatus === 'confirmed',
        notes: 'Agreement Down Payment (25%)',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m2);

      const d3 = new Date(baseDate.getTime() + 45 * 86400000).toISOString().split('T')[0];
      const m3 = {
        id: db.milestones.length + 1,
        deal: savedDeal.id,
        milestone_type: 'full_payment',
        amount: balanceAmount,
        due_date: d3,
        paid_date: dealStatus === 'confirmed' ? savedDeal.booking_date : null,
        is_paid: dealStatus === 'confirmed',
        notes: 'Registry Balance Clearance',
        created_at: new Date().toISOString(),
      };
      db.milestones.push(m3);
      milestones = [m1, m2, m3];
    }

    db.auditLogs.unshift({
      id: db.auditLogs.length + 1,
      user: 1,
      action: 'create',
      entity_type: 'Deal',
      entity_id: String(savedDeal.id),
      description: `Booked Deal #${savedDeal.id} for Plot ${plot ? plot.plot_number : plotId} (${lead ? lead.full_name : leadId})`,
      created_at: new Date().toISOString(),
    });

    db.saveToFile();

    return NextResponse.json(
      {
        ...savedDeal,
        lead_name: lead ? lead.full_name : `Lead #${savedDeal.lead}`,
        plot_number: plot ? plot.plot_number : `Plot #${savedDeal.plot}`,
        milestones,
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ detail: 'Failed to create deal' }, { status: 400 });
  }
}
