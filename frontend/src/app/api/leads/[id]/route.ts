import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  const agent = db.users.find((u) => u.id === lead.assigned_agent);
  const proj = db.projects.find((p) => p.id === lead.interested_project);
  const calls = db.calls.filter((c) => c.lead === leadId);
  const deal = db.deals.find((d) => d.lead === leadId);

  return NextResponse.json({
    ...lead,
    assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
    interested_project: proj ? { id: proj.id, name: proj.name, location: proj.location } : null,
    call_attempts: calls,
    linked_deal: deal || null,
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const leadId = Number(params.id);
  const lead = db.leads.find((l) => l.id === leadId);

  if (!lead) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    if (body.status) {
      lead.status = body.status;

      // When lead is converted to 'booked' or 'deal_confirmed', ensure a Deal exists
      if (body.status === 'booked' || body.status === 'deal_confirmed') {
        const isConfirmed = body.status === 'deal_confirmed';
        const existingDeal = db.deals.find((d) => d.lead === leadId);

        if (!existingDeal) {
          // Find an available plot
          let plot = db.plots.find(
            (p) => (lead.interested_project ? p.project === lead.interested_project : true) && p.status === 'available'
          );
          if (!plot) {
            plot = db.plots.find((p) => p.status === 'available') || db.plots[0];
          }

          const dealAmount = plot ? plot.total_price : 3500000;
          const finalAmount = dealAmount;

          const newDeal = {
            id: db.deals.length > 0 ? Math.max(...db.deals.map((d) => d.id)) + 1 : 1,
            lead: lead.id,
            plot: plot ? plot.id : 1,
            booking_date: new Date().toISOString().split('T')[0],
            deal_amount: dealAmount,
            discount: 0,
            final_amount: finalAmount,
            status: (isConfirmed ? 'confirmed' : 'booked') as 'booked' | 'confirmed' | 'cancelled',
            notes: `Converted from Lead ${lead.full_name}`,
            created_by: 1,
            created_at: new Date().toISOString(),
          };

          db.deals.unshift(newDeal);

          if (plot) {
            plot.status = isConfirmed ? 'sold' : 'reserved';
          }

          // Create standard payment milestones
          const tokenAmount = Math.round(finalAmount * 0.1);
          const downPaymentAmount = Math.round(finalAmount * 0.25);
          const balanceAmount = finalAmount - tokenAmount - downPaymentAmount;

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

          const d2 = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
          const m2 = {
            id: db.milestones.length + 1,
            deal: newDeal.id,
            milestone_type: 'down_payment',
            amount: downPaymentAmount,
            due_date: d2,
            paid_date: isConfirmed ? newDeal.booking_date : null,
            is_paid: isConfirmed,
            notes: 'Agreement Down Payment (25%)',
            created_at: new Date().toISOString(),
          };
          db.milestones.push(m2);

          const d3 = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];
          const m3 = {
            id: db.milestones.length + 1,
            deal: newDeal.id,
            milestone_type: 'full_payment',
            amount: balanceAmount,
            due_date: d3,
            paid_date: isConfirmed ? newDeal.booking_date : null,
            is_paid: isConfirmed,
            notes: 'Registry Balance Clearance',
            created_at: new Date().toISOString(),
          };
          db.milestones.push(m3);
        } else {
          // Update existing deal status
          existingDeal.status = isConfirmed ? 'confirmed' : 'booked';
          const plot = db.plots.find((p) => p.id === existingDeal.plot);
          if (plot) {
            plot.status = isConfirmed ? 'sold' : 'reserved';
          }
        }
      }

      db.auditLogs.unshift({
        id: db.auditLogs.length + 1,
        user: 1,
        action: 'status_change',
        entity_type: 'Lead',
        entity_id: String(lead.id),
        description: `Lead status changed to ${body.status}`,
        created_at: new Date().toISOString(),
      });
    }

    if (body.temperature) {
      lead.temperature = body.temperature;
    }

    if (body.assigned_agent) {
      lead.assigned_agent = Number(body.assigned_agent);
    }

    lead.updated_at = new Date().toISOString();

    db.saveToFile();

    const agent = db.users.find((u) => u.id === lead.assigned_agent);
    const proj = db.projects.find((p) => p.id === lead.interested_project);
    const calls = db.calls.filter((c) => c.lead === leadId);
    const deal = db.deals.find((d) => d.lead === leadId);

    return NextResponse.json({
      ...lead,
      assigned_agent: agent ? { id: agent.id, username: agent.username, email: agent.email } : null,
      interested_project: proj ? { id: proj.id, name: proj.name, location: proj.location } : null,
      call_attempts: calls,
      linked_deal: deal || null,
    });
  } catch (err) {
    return NextResponse.json({ detail: 'Update failed' }, { status: 400 });
  }
}
