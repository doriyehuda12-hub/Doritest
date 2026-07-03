import { NextRequest, NextResponse } from 'next/server';
import { addFollowUp, getLead } from '@/lib/db/queries';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  due_date: z.string().min(1, 'תאריך יעד חובה'),
  note: z.string().nullable().optional().default(null),
});

// POST /api/leads/[id]/followups — הוספת תזכורת מעקב לליד
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const leadId = Number(id);
  if (!getLead(leadId)) return NextResponse.json({ error: 'ליד לא נמצא' }, { status: 404 });
  try {
    const { due_date, note } = schema.parse(await req.json());
    return NextResponse.json(addFollowUp(leadId, due_date, note ?? undefined), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}
