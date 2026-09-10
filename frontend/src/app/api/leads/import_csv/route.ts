import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      return NextResponse.json({ error: 'CSV file is empty or has only headers' }, { status: 400 });
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^[']|[']$/g, ''));
    const rows = lines.slice(1);

    let created_count = 0;
    let duplicate_count = 0;
    const duplicates: any[] = [];

    const agents = db.users.filter((u) => u.role === 'agent');

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const values = rows[i].split(',').map((v) => v.trim().replace(/^[']|[']$/g, ''));
      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = values[idx] || '';
      });

      const phone = rowData['phone_primary'] || rowData['phone'] || '';
      const fullName = rowData['full_name'] || rowData['name'] || 'Unnamed Lead';

      if (!phone) continue;

      // Duplicate check
      const matched = db.leads.filter((l) => l.phone_primary === phone);
      if (matched.length > 0) {
        duplicate_count++;
        duplicates.push({
          row: rowNum,
          phone,
          existing_leads: matched.map((m) => ({ id: m.id, full_name: m.full_name, status: m.status })),
        });
        continue;
      }

      // Round robin agent assignment
      let assigned_agent: number | null = null;
      if (agents.length > 0) {
        const counts = agents.map((ag) => ({
          agent: ag,
          count: db.leads.filter((l) => l.assigned_agent === ag.id).length,
        }));
        counts.sort((a, b) => a.count - b.count);
        assigned_agent = counts[0].agent.id;
      }

      const newLead = {
        id: db.leads.length > 0 ? Math.max(...db.leads.map((l) => l.id)) + 1 : 1,
        full_name: fullName,
        phone_primary: phone,
        phone_alternate: rowData['phone_alternate'] || '',
        email: rowData['email'] || '',
        whatsapp_number: rowData['whatsapp_number'] || '',
        source: rowData['source'] || 'other',
        city: rowData['city'] || '',
        budget_range: rowData['budget_range'] || '',
        plot_size_preference: rowData['plot_size_preference'] || '',
        notes: rowData['notes'] || '',
        status: 'new',
        temperature: 'unqualified',
        assigned_agent,
        created_at: new Date().toISOString(),
      };

      db.leads.unshift(newLead);
      created_count++;
    }

    return NextResponse.json({
      created_count,
      duplicate_count,
      error_count: 0,
      duplicates,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process CSV file' }, { status: 500 });
  }
}
