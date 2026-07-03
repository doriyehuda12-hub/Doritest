import { NextRequest, NextResponse } from 'next/server';
import {
  getLead,
  updateLead,
  deleteLead,
  listInteractions,
  listMatches,
} from '@/lib/db/queries';
import { getDb } from '@/lib/db';
import { leadSchema } from '@/lib/validation';
import type { FollowUp } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/leads/[id] — כרטיס ליד מלא: פרטים, אינטראקציות, התאמות, תזכורות
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const leadId = Number(id);
  const lead = getLead(leadId);
  if (!lead) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });

  const followUps = getDb()
    .prepare('SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY due_date ASC')
    .all(leadId) as FollowUp[];

  return NextResponse.json({
    lead,
    interactions: listInteractions(leadId),
    matches: listMatches(leadId),
    followUps,
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data = leadSchema.partial().parse(body);
    if ((data as any).email === '') (data as any).email = null;
    const updated = updateLead(Number(id), data as any);
    if (!updated) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  deleteLead(Number(id));
  return NextResponse.json({ ok: true });
}
