import { NextResponse } from 'next/server';
import { listListings } from '@/lib/db/queries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COLS = ['address', 'rooms', 'area_sqm', 'price', 'status', 'owner', 'lead_source', 'description'];

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  // עוטפים בגרשיים אם יש פסיק/גרש/שורה חדשה
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// GET /api/listings/export — ייצוא נכסים כ-CSV
export async function GET() {
  const rows = listListings();
  const lines = [COLS.join(',')];
  for (const r of rows) {
    lines.push(COLS.map((c) => csvCell((r as any)[c])).join(','));
  }
  // BOM כדי שאקסל יזהה עברית UTF-8 כראוי
  const body = '﻿' + lines.join('\n');
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="listings.csv"',
    },
  });
}
