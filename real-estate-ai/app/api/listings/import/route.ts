import { NextRequest, NextResponse } from 'next/server';
import { createListing } from '@/lib/db/queries';
import { listingSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// מפענח CSV פשוט התומך בשדות עטופים בגרשיים
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = text.replace(/^﻿/, ''); // הסרת BOM
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch === '\r') { /* דילוג */ }
    else field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// POST /api/listings/import  { csv: string }  — ייבוא נכסים מ-CSV
export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json();
    if (typeof csv !== 'string' || !csv.trim()) {
      return NextResponse.json({ error: 'לא התקבל תוכן CSV' }, { status: 400 });
    }
    const rows = parseCsv(csv);
    if (rows.length < 2) return NextResponse.json({ error: 'CSV ריק או ללא שורות נתונים' }, { status: 400 });

    const header = rows[0].map((h) => h.trim());
    let created = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => (obj[h] = (rows[i][idx] ?? '').trim()));
      try {
        const data = listingSchema.parse(obj);
        createListing(data as any);
        created++;
      } catch {
        errors.push(`שורה ${i + 1}: נתונים לא תקינים`);
      }
    }

    return NextResponse.json({ created, errors });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 });
  }
}
