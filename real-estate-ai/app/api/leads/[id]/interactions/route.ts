import { NextRequest, NextResponse } from 'next/server';
import { addInteraction, getLead } from '@/lib/db/queries';
import { interactionSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/leads/[id]/interactions — הוספת אינטראקציה לציר הזמן של הליד
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const leadId = Number(id);
  if (!getLead(leadId)) return NextResponse.json({ error: 'ליד לא נמצא' }, { status: 404 });
  try {
    const body = await req.json();
    const { type, content } = interactionSchema.parse(body);
    return NextResponse.json(addInteraction(leadId, type, content), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}
