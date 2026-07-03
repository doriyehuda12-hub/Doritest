import { NextRequest, NextResponse } from 'next/server';
import { listLeads, createLead } from '@/lib/db/queries';
import { leadSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/leads — רשימת לידים
export async function GET() {
  return NextResponse.json(listLeads());
}

// POST /api/leads — יצירת ליד
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = leadSchema.parse(body);
    // מייל ריק => null
    if (data.email === '') (data as any).email = null;
    return NextResponse.json(createLead(data as any), { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues ?? String(e?.message || e) }, { status: 400 });
  }
}
