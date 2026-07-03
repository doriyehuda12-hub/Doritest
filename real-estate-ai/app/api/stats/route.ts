import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/stats — נתונים מצטברים לדשבורד
export async function GET() {
  const db = getDb();
  const listingsTotal = (db.prepare('SELECT COUNT(*) AS c FROM listings').get() as any).c;
  const leadsTotal = (db.prepare('SELECT COUNT(*) AS c FROM leads').get() as any).c;
  const byStatus = db
    .prepare('SELECT status, COUNT(*) AS c FROM listings GROUP BY status')
    .all() as { status: string; c: number }[];
  const byStage = db
    .prepare('SELECT funnel_stage AS stage, COUNT(*) AS c FROM leads GROUP BY funnel_stage')
    .all() as { stage: string; c: number }[];
  const dueFollowUps = (
    db
      .prepare("SELECT COUNT(*) AS c FROM follow_ups WHERE done = 0 AND due_date <= datetime('now')")
      .get() as any
  ).c;

  return NextResponse.json({ listingsTotal, leadsTotal, byStatus, byStage, dueFollowUps });
}
