import { NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents/registry';
import { hasKey } from '@/lib/agents/base';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/agents — רשימת הסוכנים הזמינים + האם AI פעיל (יש מפתח)
export async function GET() {
  const agents = Object.entries(AGENTS).map(([key, def]) => ({
    key,
    label: def.label,
    description: def.description,
  }));
  return NextResponse.json({ agents, aiEnabled: hasKey() });
}
