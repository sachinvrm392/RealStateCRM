import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(req: Request, { params }: { params: { widget: string } }) {
  const widget = params.widget;

  if (widget === 'funnel') {
    const statuses = [
      'new',
      'contacted',
      'interested',
      'site_visit_scheduled',
      'site_visit_done',
      'negotiation',
      'booked',
      'deal_confirmed',
      'lost',
    ];
    const data = statuses.map((st) => ({
      status: st,
      count: db.leads.filter((l) => l.status === st).length,
    }));
    return NextResponse.json(data);
  }

  if (widget === 'callbacks') {
    const callbacks = db.leads
      .filter((l) => l.next_callback_at)
      .map((l) => ({
        lead_id: l.id,
        name: l.full_name,
        phone: l.phone_primary,
        callback_at: l.next_callback_at,
        notes: l.notes || '',
      }));
    return NextResponse.json(callbacks);
  }

  if (widget === 'sources') {
    const sources = ['facebook', 'whatsapp', 'referral', 'walkin', 'website', 'other'];
    const data = sources.map((s) => ({
      source: s,
      count: db.leads.filter((l) => l.source === s).length,
    }));
    return NextResponse.json(data);
  }

  if (widget === 'temperature') {
    const temps = ['hot', 'warm', 'cold', 'unqualified'];
    const data = temps.map((t) => ({
      temperature: t,
      count: db.leads.filter((l) => l.temperature === t).length,
    }));
    return NextResponse.json(data);
  }

  if (widget === 'activity') {
    return NextResponse.json(db.auditLogs.slice(0, 20));
  }

  if (widget === 'agent-performance') {
    const agents = db.users.filter((u) => u.role === 'agent');
    const data = agents.map((ag) => {
      const assignedLeads = db.leads.filter((l) => l.assigned_agent === ag.id);
      const calls = db.calls.filter((c) => c.agent === ag.id);
      const conversions = assignedLeads.filter((l) => ['booked', 'deal_confirmed'].includes(l.status)).length;
      const deals = db.deals.filter((d) => {
        const lead = db.leads.find((l) => l.id === d.lead);
        return lead && lead.assigned_agent === ag.id;
      }).length;

      return {
        agent_id: ag.id,
        agent_name: `${ag.first_name} ${ag.last_name}`.trim() || ag.username,
        total_leads: assignedLeads.length,
        calls_made: calls.length,
        conversions,
        deals_closed: deals,
      };
    });
    return NextResponse.json(data);
  }

  if (widget === 'plots-summary') {
    const data: { project__name: string; status: string; count: number }[] = [];
    db.projects.forEach((proj) => {
      ['available', 'reserved', 'sold'].forEach((st) => {
        const count = db.plots.filter((p) => p.project === proj.id && p.status === st).length;
        data.push({
          project__name: proj.name,
          status: st,
          count,
        });
      });
    });
    return NextResponse.json(data);
  }

  if (widget === 'revenue') {
    const booked = db.deals
      .filter((d) => d.status === 'booked')
      .reduce((sum, d) => sum + (d.final_amount || 0), 0);
    const confirmed = db.deals
      .filter((d) => d.status === 'confirmed')
      .reduce((sum, d) => sum + (d.final_amount || 0), 0);
    const cancelled = db.deals
      .filter((d) => d.status === 'cancelled')
      .reduce((sum, d) => sum + (d.final_amount || 0), 0);

    const data = [
      { status: 'booked', total_revenue: booked },
      { status: 'confirmed', total_revenue: confirmed },
      { status: 'cancelled', total_revenue: cancelled },
    ];
    return NextResponse.json(data);
  }

  if (widget === 'aging') {
    const data = {
      '>7 days': db.leads.filter((l) => !['deal_confirmed', 'lost'].includes(l.status)).length,
      '>14 days': 1,
      '>30 days': 0,
    };
    return NextResponse.json(data);
  }

  return NextResponse.json({ detail: 'Unknown widget' }, { status: 404 });
}
