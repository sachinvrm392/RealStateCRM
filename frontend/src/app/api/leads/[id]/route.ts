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
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    let authUser = db.users[0];
    if (token.startsWith('ey.')) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const found = db.users.find((u) => u.id === payload.user_id || u.username === payload.username);
        if (found) authUser = found;
      } catch (e) {
        // fallback
      }
    }

    const body = await req.json();
    const oldStatus = lead.status;
    const isStatusChanging = Boolean(body.status && body.status !== oldStatus);

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
            created_by: authUser ? authUser.id : 1,
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
    }

    // Automatically create a Communication Log entry on status change or when comments are passed
    if (isStatusChanging || body.status_comments || body.status_comment) {
      const actorName = authUser
        ? `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim() || authUser.username
        : 'Team Member';
      const actorRole = authUser?.role || 'manager';
      const commentsText =
        body.status_comments ||
        body.status_comment ||
        body.comments ||
        `Status updated from ${oldStatus.replace(/_/g, ' ')} to ${(body.status || lead.status).replace(/_/g, ' ')}`;

      const statusLog = {
        id: db.calls.length > 0 ? Math.max(...db.calls.map((c) => c.id)) + 1 : 1,
        lead: leadId,
        agent: authUser ? authUser.id : (lead.assigned_agent || 1),
        agent_name: `${actorName} (${actorRole.replace('_', ' ')})`,
        outcome: `status_${body.status || lead.status}`,
        notes: commentsText,
        callback_scheduled_at: body.next_callback_at || null,
        recording_file: null,
        created_at: new Date().toISOString(),
      };

      db.calls.unshift(statusLog);
      lead.last_contacted_at = new Date().toISOString();

      db.auditLogs.unshift({
        id: db.auditLogs.length + 1,
        user: authUser ? authUser.id : 1,
        action: 'status_change',
        entity_type: 'Lead',
        entity_id: String(lead.id),
        description: `Lead status changed to ${body.status || lead.status} by ${actorName}. Notes: ${commentsText}`,
        created_at: new Date().toISOString(),
      });
    }

    // Update any provided fields
    if (body.full_name !== undefined) lead.full_name = body.full_name;
    if (body.phone_primary !== undefined) lead.phone_primary = body.phone_primary;
    if (body.phone_alternate !== undefined) lead.phone_alternate = body.phone_alternate;
    if (body.email !== undefined) lead.email = body.email;
    if (body.whatsapp_number !== undefined) lead.whatsapp_number = body.whatsapp_number;
    if (body.source !== undefined) lead.source = body.source;
    if (body.city !== undefined) lead.city = body.city;
    if (body.interested_project !== undefined) lead.interested_project = body.interested_project ? Number(body.interested_project) : null;
    if (body.budget_range !== undefined) lead.budget_range = body.budget_range;
    if (body.plot_size_preference !== undefined) lead.plot_size_preference = body.plot_size_preference;
    if (body.notes !== undefined) lead.notes = body.notes;

    if (body.temperature) {
      lead.temperature = body.temperature;
    }

    if (body.assigned_agent !== undefined) {
      lead.assigned_agent = body.assigned_agent ? Number(body.assigned_agent) : null;
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  db.sync();
  const leadId = Number(params.id);
  const index = db.leads.findIndex((l) => l.id === leadId);

  if (index === -1) {
    return NextResponse.json({ detail: 'Lead not found' }, { status: 404 });
  }

  const removed = db.leads.splice(index, 1)[0];
  // Remove associated calls
  db.calls = db.calls.filter((c) => c.lead !== leadId);

  db.auditLogs.unshift({
    id: db.auditLogs.length + 1,
    user: 1,
    action: 'delete',
    entity_type: 'Lead',
    entity_id: String(leadId),
    description: `Deleted Lead ${removed.full_name}`,
    created_at: new Date().toISOString(),
  });

  db.saveToFile();

  return NextResponse.json({ message: 'Lead deleted successfully', id: leadId });
}
