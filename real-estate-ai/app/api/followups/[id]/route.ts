import { NextRequest, NextResponse } from 'next/server';
import { completeFollowUp, deleteFollowUp } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/followups/[id] — סימון תזכורת כבוצעה
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  completeFollowUp(Number(id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/followups/[id] — מחיקת תזכורת
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  deleteFollowUp(Number(id));
  return NextResponse.json({ ok: true });
}
