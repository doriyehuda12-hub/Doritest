import { NextResponse } from 'next/server';
import { syncListings } from '@/lib/services/sheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/sheets/sync — סנכרון ידני של נכסים מול Google Sheets
export async function POST() {
  try {
    const result = await syncListings();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { configured: true, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
