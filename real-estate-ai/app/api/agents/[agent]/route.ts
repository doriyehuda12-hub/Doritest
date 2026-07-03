import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ agent: string }> };

// POST /api/agents/[agent] — הרצת סוכן. גוף הבקשה = קלט הסוכן.
export async function POST(req: NextRequest, { params }: Ctx) {
  const { agent } = await params;
  const def = AGENTS[agent];
  if (!def) return NextResponse.json({ error: 'סוכן לא קיים' }, { status: 404 });

  const input = await req.json().catch(() => ({}));
  try {
    const result = await def.run(input);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
